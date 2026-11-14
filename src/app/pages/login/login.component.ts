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
    <div class="login-backdrop">
      <div class="login-container">
        <!-- Brand Header -->
        <div class="login-header">
          <div class="brand-badge">
            <div class="brand-logo">
              <svg class="svg-icon" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 class="brand-title">La Bolaria — ERP &amp; Receituário</h1>
              <p class="brand-subtitle">
                Sistema de Engenharia de Cardápio, Fichas Técnicas e Cálculo de CMV
              </p>
            </div>
          </div>
        </div>

        <div class="access-grid">
          <!-- CARD 1: MODO DEMO / PORTFÓLIO (RECRUTADORES) -->
          <div class="access-card demo-card">
            <div class="card-tag demo-tag">PORTFÓLIO / VISITANTE</div>
            <h2 class="card-title">Explorar Modo Demonstração</h2>
            <p class="card-desc">
              Ideal para <strong>recrutadores e visitantes</strong>. Teste todas as funcionalidades
              do sistema (criação de produtos, estoque de insumos, fichas técnicas e cálculo automático
              de CMV e lucro) com <strong>receitas fictícias</strong>.
            </p>

            <ul class="feature-list">
              <li>✓ Acesso imediato em 1 clique (sem senha)</li>
              <li>✓ Receitas e custos fictícios pré-carregados</li>
              <li>✓ Liberdade para criar, editar e excluir itens</li>
              <li>✓ Dados originais da confeitaria 100% protegidos</li>
            </ul>

            <button
              type="button"
              class="btn-action btn-demo"
              (click)="entrarDemo()"
            >
              <span>Entrar como Visitante (Modo Demo)</span>
              <svg class="svg-icon sm" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>

          <!-- CARD 2: ACESSO RESTRITO CONFEITARIA (PRODUÇÃO) -->
          <div class="access-card prod-card">
            <div class="card-tag prod-tag">AMBIENTE DE PRODUÇÃO</div>
            <h2 class="card-title">Acesso Restrito — La Bolaria</h2>
            <p class="card-desc">
              Acesso exclusivo para a equipe interna da confeitaria, conectado ao banco de dados
              oficial de produção e ao receituário confidencial.
            </p>

            <form (ngSubmit)="entrarConfeitaria()" class="login-form">
              <div class="field-group">
                <label for="senhaInput">Chave de Acesso da Confeitaria</label>
                <div class="password-wrapper">
                  <input
                    id="senhaInput"
                    [type]="mostrarSenha() ? 'text' : 'password'"
                    [(ngModel)]="senha"
                    name="senha"
                    placeholder="Digite a senha de acesso..."
                    autocomplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    class="toggle-pass"
                    (click)="mostrarSenha.set(!mostrarSenha())"
                    title="Mostrar/ocultar senha"
                  >
                    {{ mostrarSenha() ? 'Ocultar' : 'Mostrar' }}
                  </button>
                </div>
              </div>

              @if (erro()) {
                <div class="login-error">
                  {{ erro() }}
                </div>
              }

              <button
                type="submit"
                class="btn-action btn-prod"
                [disabled]="validando()"
              >
                <span>{{ validando() ? 'Verificando...' : 'Acessar Sistema Oficial' }}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-backdrop {
        min-height: 100vh;
        width: 100%;
        background: linear-gradient(135deg, #f8f9fb 0%, #eef1f6 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }

      .login-container {
        width: 100%;
        max-width: 880px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .login-header {
        background: #ffffff;
        border: 1px solid #e4e7ec;
        border-radius: 14px;
        padding: 20px 24px;
        box-shadow: 0 2px 8px rgba(16, 24, 40, 0.04);
      }

      .brand-badge {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .brand-logo {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        background: #18181b;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .brand-title {
        font-size: 18px;
        font-weight: 700;
        color: #101828;
        margin: 0 0 2px 0;
      }

      .brand-subtitle {
        font-size: 13px;
        color: #667085;
        margin: 0;
      }

      .access-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }

      @media (max-width: 768px) {
        .login-backdrop {
          padding: 14px;
          align-items: flex-start;
        }

        .login-container {
          gap: 14px;
        }

        .login-header {
          padding: 16px;
        }

        .brand-title {
          font-size: 15.5px;
        }

        .brand-subtitle {
          font-size: 12px;
        }

        .access-grid {
          grid-template-columns: 1fr;
          gap: 14px;
        }

        .access-card {
          padding: 18px;
        }
      }

      .access-card {
        background: #ffffff;
        border: 1px solid #e4e7ec;
        border-radius: 14px;
        padding: 26px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 4px 12px rgba(16, 24, 40, 0.05);
      }

      .demo-card {
        border: 2px solid #ff5a1f;
        position: relative;
      }

      .card-tag {
        align-self: flex-start;
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: 0.06em;
        padding: 4px 10px;
        border-radius: 999px;
        margin-bottom: 12px;
      }

      .demo-tag {
        background: #fff4ed;
        color: #ff5a1f;
      }

      .prod-tag {
        background: #f2f4f7;
        color: #344054;
      }

      .card-title {
        font-size: 17px;
        font-weight: 700;
        color: #101828;
        margin: 0 0 8px 0;
      }

      .card-desc {
        font-size: 13px;
        line-height: 1.55;
        color: #475467;
        margin: 0 0 16px 0;
      }

      .feature-list {
        list-style: none;
        padding: 0;
        margin: 0 0 22px 0;
        display: flex;
        flex-direction: column;
        gap: 7px;
        font-size: 12.5px;
        color: #344054;
        flex: 1;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
        margin-top: auto;
      }

      .field-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .field-group label {
        font-size: 12.5px;
        font-weight: 600;
        color: #344054;
      }

      .password-wrapper {
        display: flex;
        align-items: center;
        border: 1px solid #d0d5dd;
        border-radius: 8px;
        overflow: hidden;
        background: #ffffff;
      }

      .password-wrapper:focus-within {
        border-color: #18181b;
        box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.08);
      }

      .password-wrapper input {
        flex: 1;
        border: none;
        padding: 10px 12px;
        font-size: 13.5px;
        outline: none;
        color: #101828;
      }

      .toggle-pass {
        border: none;
        background: transparent;
        color: #667085;
        font-size: 12px;
        font-weight: 600;
        padding: 0 12px;
        cursor: pointer;
      }

      .toggle-pass:hover {
        color: #101828;
      }

      .login-error {
        background: #fef3f2;
        border: 1px solid #fecdca;
        color: #b42318;
        font-size: 12.5px;
        padding: 8px 12px;
        border-radius: 8px;
      }

      .btn-action {
        width: 100%;
        height: 42px;
        border-radius: 9px;
        border: none;
        font-size: 13.5px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.15s ease;
      }

      .btn-demo {
        background: #ff5a1f;
        color: #ffffff;
      }

      .btn-demo:hover {
        background: #e04812;
      }

      .btn-prod {
        background: #18181b;
        color: #ffffff;
      }

      .btn-prod:hover {
        background: #27272a;
      }

      .btn-prod:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
        this.erro.set(
          'Senha incorreta. Para explorar o portfólio sem senha, utilize o botão "Entrar como Visitante (Modo Demo)".'
        );
      }
    } finally {
      this.validando.set(false);
    }
  }
}
