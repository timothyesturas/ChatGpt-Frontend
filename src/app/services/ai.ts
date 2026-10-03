import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChartData {
  type: 'bar' | 'pie';
  labels: string[];
  values: number[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  chart?: ChartData | null;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  response: string;
  chart?: ChartData | null;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/api/ai/chat';

  clearMessages(
    conversationId: string
  ): Observable<void> {

    return this.http.delete<void>(
      `http://localhost:3000/api/conversations/${conversationId}/messages`
    );

  }

  addMessage(
    conversationId: string,
    message: ChatMessage
  ): Observable<ChatMessage> {

    return this.http.post<ChatMessage>(
      `http://localhost:3000/api/conversations/${conversationId}/messages`,
      message
    );
  }

  sendMessage(messages: ChatMessage[]): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      this.apiUrl,
      {
        messages
      }
    );
  }


  getConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(
      'http://localhost:3000/api/conversations'
    );
  }


  getConversation(
    id: string
  ): Observable<Conversation> {

    return this.http.get<Conversation>(
      `http://localhost:3000/api/conversations/${id}`
    );
  }


  createConversation(
    title = 'New Chat'
  ): Observable<Conversation> {

    return this.http.post<Conversation>(
      'http://localhost:3000/api/conversations',
      {
        title
      }
    );
  }


  renameConversation(
    id: string,
    title: string
  ): Observable<Conversation> {

    return this.http.patch<Conversation>(
      `http://localhost:3000/api/conversations/${id}`,
      {
        title
      }
    );
  }


  deleteConversation(
    id: string
  ): Observable<void> {

    return this.http.delete<void>(
      `http://localhost:3000/api/conversations/${id}`
    );
  }
}