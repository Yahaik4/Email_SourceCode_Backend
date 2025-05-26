import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getUserIdFromToken } from 'src/utils/jwt.util'; // Giả sử hàm này nằm trong file jwt.util.ts

@WebSocketGateway({
  cors: {
    origin: '*', // Thay đổi theo domain của frontend nếu cần
  },
})
@Injectable()
export class EmailGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const token = client.handshake.query.token as string;

    const req = {
      headers: {
        authorization: token ? `Bearer ${token}` : undefined,
      },
      cookies: {},
    } as any;

    try {
      const userId = getUserIdFromToken(req, this.jwtService);
      if (userId) {
        this.connectedClients.set(userId, client);
        console.log(`Client connected: ${userId}`);
      } else {
        console.log('Invalid or missing token, disconnecting client');
        client.disconnect();
      }
    } catch (error) {
      console.log(`Error verifying token: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.connectedClients.entries()).find(
      ([, socket]) => socket.id === client.id,
    )?.[0];
    if (userId) {
      this.connectedClients.delete(userId);
      console.log(`Client disconnected: ${userId}`);
    }
  }

  notifyNewEmail(userId: string, email: any) {
    const client = this.connectedClients.get(userId);
    if (client) {
      client.emit('newEmail', email);
    }
  }
}