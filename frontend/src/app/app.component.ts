import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WebSocketService } from './services/web-socket.service';
import { SessionService } from './services/session.service';
import { GameStateService } from './services/game-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private webSocketService = inject(WebSocketService);
  private sessionService = inject(SessionService);
  private gameStateService = inject(GameStateService);

  title = 'frontend';

  ngOnInit(): void {
    const sessionId = this.sessionService.getSessionId();
    if (sessionId) {
      console.log('Found existing session, attempting reconnection:', sessionId);
      this.gameStateService.setReconnecting();
      this.webSocketService.connect();
      this.webSocketService.reconnect(sessionId);
      
      this.webSocketService.getStateSync().subscribe(() => {
        if (this.gameStateService.getCurrentState() === 'RECONNECTING') {
           console.log('State synced after reconnection');
        }
      });
    }
  }
}
