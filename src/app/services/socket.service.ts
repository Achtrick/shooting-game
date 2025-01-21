import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('https://shooting-game-server-d55t.onrender.com/');
  }

  public emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }

  public on(event: string, callback: (data: any) => void): void {
    this.socket.on(event, callback);
  }

  public disconnect(): void {
    this.socket.disconnect();
  }

  public reconnect(): void {
    this.socket.connect();
  }

  // CUSTOM FUNCTIONS

  public joinMatch(id: string): Promise<Room> {
    return new Promise((resolve) => {
      this.emit('JOIN_ROOM', id);
      this.on('MATCH_FOUND', (room) => {
        resolve(room);
      });
    });
  }
}
