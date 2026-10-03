import {
  AfterViewChecked,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  SecurityContext,
  ViewChild,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import { DomSanitizer } from '@angular/platform-browser';

import { marked } from 'marked';

import {
  AiService,
  ChatMessage,
  Conversation
} from '../services/ai';

import { ChartComponent } from '../components/chart/chart';

@Component({
  selector: 'app-chat',

  imports: [
    FormsModule,
    ChartComponent
  ],

  templateUrl: './chat.html',

  styleUrl: './chat.css'
})
export class Chat implements OnInit, AfterViewChecked {

  private aiService = inject(AiService);

  private sanitizer = inject(DomSanitizer);

  private cdr = inject(ChangeDetectorRef);


  @ViewChild('chatBox')
  private chatBox!: ElementRef<HTMLDivElement>;


  conversations: Conversation[] = [];

  currentConversationId: string | null = null;

  message = '';

  loading = false;

  editingConversationId: string | null = null;

  editingTitle = '';

  conversationToDeleteId: string | null = null;

  private shouldScroll = false;


  ngOnInit(): void {

    this.loadConversations();

  }


  get currentConversation(): Conversation | undefined {

    return this.conversations.find(
      conversation =>
        conversation.id === this.currentConversationId
    );

  }


  get messages(): ChatMessage[] {

    return this.currentConversation?.messages ?? [];

  }


  startRename(conversation: Conversation): void {

    if (this.loading) {
      return;
    }

    this.editingConversationId =
      conversation.id;

    this.editingTitle =
      conversation.title;

    this.cdr.detectChanges();
  }


  saveRename(): void {

    if (!this.editingConversationId) {
      return;
    }

    const title =
      this.editingTitle.trim();

    if (!title) {
      return;
    }

    this.aiService
      .renameConversation(
        this.editingConversationId,
        title
      )
      .subscribe({

        next: (updatedConversation) => {

          const conversation =
            this.conversations.find(
              conversation =>
                conversation.id ===
                this.editingConversationId
            );

          if (conversation) {

            conversation.title =
              updatedConversation.title;

            conversation.updatedAt =
              updatedConversation.updatedAt;

          }

          this.editingConversationId = null;

          this.editingTitle = '';

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Failed to rename conversation:',
            error
          );

          this.cdr.detectChanges();

        }

      });

  }


  cancelRename(): void {

    this.editingConversationId = null;

    this.editingTitle = '';

    this.cdr.detectChanges();

  }


  confirmDelete(conversation: Conversation): void {

    if (this.loading) {
      return;
    }

    this.conversationToDeleteId =
      conversation.id;

    this.cdr.detectChanges();

  }


  cancelDelete(): void {

    this.conversationToDeleteId = null;

    this.cdr.detectChanges();

  }


  deleteConversation(): void {

    if (!this.conversationToDeleteId) {
      return;
    }

    const id =
      this.conversationToDeleteId;

    this.aiService
      .deleteConversation(id)
      .subscribe({

        next: () => {

          const index =
            this.conversations.findIndex(
              conversation =>
                conversation.id === id
            );

          if (index !== -1) {

            this.conversations.splice(
              index,
              1
            );

          }


          if (
            this.currentConversationId === id
          ) {

            if (this.conversations.length > 0) {

              this.currentConversationId =
                this.conversations[0].id;

              this.loadCurrentConversation();

            } else {

              this.currentConversationId =
                null;

              this.createConversation();

            }

          }


          this.conversationToDeleteId =
            null;

          this.message = '';

          this.shouldScroll = false;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Failed to delete conversation:',
            error
          );

          this.conversationToDeleteId =
            null;

          this.cdr.detectChanges();

        }

      });

  }


  sendMessage(): void {

    const text =
      this.message.trim();

    if (!text || this.loading) {
      return;
    }


    if (!this.currentConversationId) {

      this.createConversation(text);

      return;

    }


    const conversation =
      this.currentConversation;

    if (!conversation) {
      return;
    }


    this.loading = true;

    this.message = '';

    this.shouldScroll = true;

    this.cdr.detectChanges();


    const userMessage: ChatMessage = {

      role: 'user',

      content: text

    };


    this.aiService
      .addMessage(
        conversation.id,
        userMessage
      )
      .subscribe({

        next: (savedUserMessage) => {

          conversation.messages.push(
            savedUserMessage
          );


          if (
            conversation.messages.length === 1 ||
            conversation.title === 'New Chat'
          ) {

            const newTitle =
              this.createTitle(text);

            this.aiService
              .renameConversation(
                conversation.id,
                newTitle
              )
              .subscribe({

                next: (updatedConversation) => {

                  conversation.title =
                    updatedConversation.title;

                  conversation.updatedAt =
                    updatedConversation.updatedAt;

                  this.cdr.detectChanges();

                },

                error: (error) => {

                  console.error(
                    'Failed to update conversation title:',
                    error
                  );

                }

              });

          }


          this.shouldScroll = true;

          this.cdr.detectChanges();


          this.aiService
            .sendMessage(
              conversation.messages
            )
            .subscribe({

              next: (result) => {

                const assistantMessage:
                  ChatMessage = {

                  role: 'assistant',

                  content:
                    result.response,

                  chart:
                    result.chart ?? null

                };


                this.aiService
                  .addMessage(
                    conversation.id,
                    assistantMessage
                  )
                  .subscribe({

                    next: (savedAssistantMessage) => {

                      conversation.messages.push(
                        savedAssistantMessage
                      );

                      this.loading = false;

                      this.shouldScroll = true;

                      this.cdr.detectChanges();

                    },

                    error: (error) => {

                      console.error(
                        'Failed to save AI response:',
                        error
                      );

                      this.loading = false;

                      this.cdr.detectChanges();

                    }

                  });

              },

              error: (error) => {

                console.error(
                  'AI request failed:',
                  error
                );


                conversation.messages.push({

                  role: 'assistant',

                  content:
                    'Sorry, something went wrong.',

                  chart: null

                });


                this.loading = false;

                this.shouldScroll = true;

                this.cdr.detectChanges();

              }

            });

        },

        error: (error) => {

          console.error(
            'Failed to save user message:',
            error
          );

          this.loading = false;

          this.cdr.detectChanges();

        }

      });

  }


  createConversation(firstMessage?: string): void {

    const title =
      firstMessage
        ? this.createTitle(firstMessage)
        : 'New Chat';


    this.aiService
      .createConversation(title)
      .subscribe({

        next: (conversation) => {

          this.conversations.unshift(
            conversation
          );

          this.currentConversationId =
            conversation.id;

          this.message = '';

          this.shouldScroll = false;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Failed to create conversation:',
            error
          );

          this.cdr.detectChanges();

        }

      });

  }


  selectConversation(id: string): void {

    if (this.loading) {
      return;
    }

    if (
      id === this.currentConversationId
    ) {
      return;
    }

    this.currentConversationId = id;

    this.message = '';

    this.loadCurrentConversation();

    this.cdr.detectChanges();

  }


  private loadCurrentConversation(): void {

    if (!this.currentConversationId) {
      return;
    }


    this.aiService
      .getConversation(
        this.currentConversationId
      )
      .subscribe({

        next: (conversation) => {

          const index =
            this.conversations.findIndex(
              item =>
                item.id === conversation.id
            );


          if (index !== -1) {

            this.conversations[index] =
              conversation;

          }


          this.shouldScroll = true;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Failed to load conversation:',
            error
          );

          this.cdr.detectChanges();

        }

      });

  }


  clearConversation(): void {

    if (!this.currentConversationId) {
      return;
    }

    if (this.loading) {
      return;
    }


    const conversation =
      this.currentConversation;

    if (!conversation) {
      return;
    }


    this.aiService
      .clearMessages(
        conversation.id
      )
      .subscribe({

        next: () => {

          conversation.messages = [];

          conversation.title = 'New Chat';

          this.message = '';

          this.loading = false;

          this.shouldScroll = false;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Failed to clear conversation:',
            error
          );

          this.cdr.detectChanges();

        }

      });

  }


  private createTitle(message: string): string {

    const title =
      message.trim();

    if (title.length <= 30) {
      return title;
    }

    return title.substring(0, 30) + '...';

  }


  private loadConversations(): void {

    this.aiService
      .getConversations()
      .subscribe({

        next: (conversations) => {

          this.conversations =
            conversations;


          if (
            this.conversations.length === 0
          ) {

            this.createConversation();

            return;

          }


          this.currentConversationId =
            this.conversations[0].id;


          this.loadCurrentConversation();

          this.shouldScroll = true;

          this.cdr.detectChanges();

        },

        error: (error) => {

          console.error(
            'Failed to load conversations:',
            error
          );

          this.cdr.detectChanges();

        }

      });

  }


  formatMessage(content: string): string {

    const html =
      marked.parse(content);


    if (typeof html !== 'string') {
      return '';
    }


    return this.sanitizer.sanitize(
      SecurityContext.HTML,
      html
    ) ?? '';

  }


  ngAfterViewChecked(): void {

    if (
      !this.shouldScroll ||
      !this.chatBox
    ) {
      return;
    }


    const element =
      this.chatBox.nativeElement;


    element.scrollTop =
      element.scrollHeight;


    this.shouldScroll = false;

  }

}