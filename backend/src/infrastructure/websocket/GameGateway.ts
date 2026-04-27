import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JoinGameUseCase } from '../../application/use-cases/JoinGameUseCase';
import { StartGameUseCase } from '../../application/use-cases/StartGameUseCase';
import { MakeMoveUseCase } from '../../application/use-cases/MakeMoveUseCase';
import { ReconnectUseCase } from '../../application/use-cases/ReconnectUseCase';
import { LeaveGameUseCase } from '../../application/use-cases/LeaveGameUseCase';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);
  private readonly playerSocketMap = new Map<string, string>(); // playerId -> socketId
  private readonly socketPlayerMap = new Map<string, string>(); // socketId -> playerId
  private readonly disconnectTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly joinGameUseCase: JoinGameUseCase,
    private readonly startGameUseCase: StartGameUseCase,
    private readonly makeMoveUseCase: MakeMoveUseCase,
    private readonly reconnectUseCase: ReconnectUseCase,
    private readonly leaveGameUseCase: LeaveGameUseCase,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const playerId = this.socketPlayerMap.get(client.id);
    if (playerId) {
      this.socketPlayerMap.delete(client.id);
      
      // Start 30s timeout for cleanup
      const timeout = setTimeout(async () => {
        this.logger.log(`Player ${playerId} timeout reached, cleaning up...`);
        this.playerSocketMap.delete(playerId);
        this.disconnectTimeouts.delete(playerId);
        // Optional: Trigger LeaveGameUseCase if session is active
      }, 30000);
      
      this.disconnectTimeouts.set(playerId, timeout);
    }
  }

  @SubscribeMessage('JOIN_GAME')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; playerId: string; playerName: string },
  ) {
    try {
      const result = await this.joinGameUseCase.execute(data);
      this.updatePlayerMaps(data.playerId, client.id);
      client.join(data.sessionId);
      
      this.server.to(data.sessionId).emit('STATE_SYNC', result.state);
      this.server.to(data.sessionId).emit('PLAYER_JOINED', { playerId: data.playerId, name: data.playerName });
    } catch (error) {
      client.emit('EVENT_ERROR', { message: error.message });
    }
  }

  @SubscribeMessage('START_GAME')
  async handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string },
  ) {
    try {
      const result = await this.startGameUseCase.execute(data);
      this.server.to(data.sessionId).emit('GAME_STARTED', result.state);
      this.server.to(data.sessionId).emit('STATE_SYNC', result.state);
    } catch (error) {
      client.emit('EVENT_ERROR', { message: error.message });
    }
  }

  @SubscribeMessage('MAKE_MOVE')
  async handleMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; playerId: string; move: any },
  ) {
    try {
      const result = await this.makeMoveUseCase.execute(data);
      this.server.to(data.sessionId).emit('MOVE_APPLIED', { 
        playerId: data.playerId, 
        move: data.move,
        newState: result.state 
      });
      this.server.to(data.sessionId).emit('STATE_SYNC', result.state);
    } catch (error) {
      client.emit('EVENT_ERROR', { message: error.message });
    }
  }

  @SubscribeMessage('RECONNECT')
  async handleReconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; playerId: string },
  ) {
    try {
      const result = await this.reconnectUseCase.execute(data);
      
      // Clear existing timeout if any
      const existingTimeout = this.disconnectTimeouts.get(data.playerId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.disconnectTimeouts.delete(data.playerId);
      }

      this.updatePlayerMaps(data.playerId, client.id);
      client.join(data.sessionId);
      
      client.emit('STATE_SYNC', result.state);
      this.server.to(data.sessionId).emit('PLAYER_RECONNECTED', { playerId: data.playerId });
    } catch (error) {
      client.emit('EVENT_ERROR', { message: error.message });
    }
  }

  @SubscribeMessage('LEAVE_GAME')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; playerId: string },
  ) {
    try {
      await this.leaveGameUseCase.execute(data);
      this.playerSocketMap.delete(data.playerId);
      this.socketPlayerMap.delete(client.id);
      client.leave(data.sessionId);
      this.server.to(data.sessionId).emit('PLAYER_LEFT', { playerId: data.playerId });
    } catch (error) {
      client.emit('EVENT_ERROR', { message: error.message });
    }
  }

  private updatePlayerMaps(playerId: string, socketId: string) {
    this.playerSocketMap.set(playerId, socketId);
    this.socketPlayerMap.set(socketId, playerId);
  }
}
