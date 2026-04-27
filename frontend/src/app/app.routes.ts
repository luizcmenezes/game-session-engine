import { Routes } from '@angular/router';
import { LobbyComponent } from './components/lobby/lobby.component';
import { SnakeComponent } from './components/games/snake/snake.component';
import { WarLightComponent } from './components/games/war-light/war-light.component';

export const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: 'games/snake', component: SnakeComponent },
  { path: 'games/war-light', component: WarLightComponent },
  { path: '**', redirectTo: '' }
];
