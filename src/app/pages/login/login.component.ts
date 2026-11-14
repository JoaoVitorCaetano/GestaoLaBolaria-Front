import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-screen">
      <div class="login-box">
        <!-- Brand -->
        <div class="brand">
          <div class="brand-icon">
            <svg class="svg-icon" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 class="brand-name">La Bolaria</h1>
          <p class="brand-sub">Gestão de Insumos &amp; Fichas Técnicas</p>
        </div>

        <!-- Produção Form -->
        <form (ngSubmit)="entrarConfeitaria()" class="auth-form">
          <div class="input-group">
            <input
              id="senhaInput"
              [type]="mostrarSenha() ? 'text' : 'password'"
              [(ngModel)]="senha"
              name="senha"
              placeholder="Senha de acesso..."
              autocomplete="current-password"
              required
            />
            <button
              type="button"
              class="eye-btn"
              (click)="mostrarSenha.set(!mostrarSenha())"
            >
              {{ mostrarSenha() ? 'Ocultar' : 'Ver' }}
            </button>
          </div>

          @if (erro()) {
            <div class="error-msg">{{ erro() }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="validando()">
            {{ validando() ? 'Entrando...' : 'Entrar na Produção' }}
          </button>
        </form>

        <div class="divider">
          <span>ou</span>
        </div>

        <!-- Demo Button -->
        <button type="button" class="btn-demo" (click)="entrarDemo()">
          Explorar Modo Demonstração
        </button>
        <p class="demo-hint">Acesso sem senha com receitas fictícias</p>
      </div>
    </div>
  `,
  styles: [
    `
      .login-screen {
        min-height: 100dvh;
        width: 100%;
        background: #f8f9fb;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .login-box {
        width: 100%;
        max-width: 360px;
        background: #ffffff;
        border: 1px solid #eaecf0;
        border-radius: 12px;
        padding: 28px 24px;
        box-shadow: 0 2px 10px rgba(16, 24, 40, 0.03);
        display: flex;
        flex-direction: column;
      }

      .brand {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        margin-bottom: 22px;
      }

      .brand-icon {
        width: 38px;
        height: 38px;
        border-radius: 9px;
        background: #18181b;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 10px;
      }

      .brand-name {
        font-size: 17px;
        font-weight: 700;
        color: #101828;
        margin: 0 0 3px 0;
      }

      .brand-sub {
        font-size: 12.5px;
        color: #667085;
        margin: 0;
      }

      .auth-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .input-group {
        display: flex;
        align-items: center;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        background: #ffffff;
        overflow: hidden;
        transition: border-color 0.15s ease;
      }

      .input-group:focus-within {
        border-color: #18181b;
      }

      .input-group input {
        flex: 1;
        height: 38px;
        border: none;
        padding: 0 12px;
        font-size: 13px;
        color: #101828;
        outline: none;
        min-width: 0;
      }

      .eye-btn {
        border: none;
        background: transparent;
        color: #667085;
        font-size: 11.5px;
        font-weight: 500;
        padding: 0 10px;
        cursor: pointer;
      }

      .eye-btn:hover {
        color: #101828;
      }

      .error-msg {
        font-size: 12px;
        color: #b42318;
        background: #fef3f2;
        border: 1px solid #fecdca;
        border-radius: 6px;
        padding: 7px 10px;
      }

      .btn-primary {
        height: 38px;
        border-radius: 8px;
        border: none;
        background: #18181b;
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease;
      }

      .btn-primary:hover:not(:disabled) {
        background: #27272a;
      }

      .btn-primary:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .divider {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 16px 0;
        color: #98a2b3;
        font-size: 11.5px;
      }

      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: #eaecf0;
      }

      .btn-demo {
        height: 38px;
        border-radius: 8px;
        border: 1px solid #d0d5dd;
        background: #ffffff;
        color: #101828;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .btn-demo:hover {
        background: #f8f9fb;
        border-color: #98a2b3;
      }

      .demo-hint {
        text-align: center;
        font-size: 11.5px;
        color: #667085;
        margin: 8px 0 0 0;
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  senha = '';
  mostrarSenha = signal(false);
  validando = signal(false);
  erro = signal('');

  entrarDemo(): void {
    this.auth.entrarModoDemo();
  }

  async entrarConfeitaria(): Promise<void> {
    this.erro.set('');
    this.validando.set(true);
    try {
      const ok = await this.auth.loginConfeitaria(this.senha);
      if (ok) {
        this.router.navigate(['/produtos']);
      } else {
        this.erro.set('Senha incorreta.');
      }
    } finally {
      this.validando.set(false);
    }
  }
}
