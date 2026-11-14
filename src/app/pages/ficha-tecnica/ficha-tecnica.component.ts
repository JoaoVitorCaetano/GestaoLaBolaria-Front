import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FichaTecnicaService } from '../../services/ficha-tecnica.service';
import { IngredienteService } from '../../services/ingrediente.service';
import { ProdutoService } from '../../services/produto.service';
import {
  FichaTecnicaResponse,
  IngredienteResponse,
  ItemFichaTecnicaResponse,
  ProdutoResponse,
  UnidadeMedida,
} from '../../models/api.models';

@Component({
  selector: 'app-ficha-tecnica',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="saas-page">
      <!-- TOP BAR -->
      <header class="topbar">
        <div class="topbar-left">
          <a routerLink="/produtos" class="btn btn-sm">
            <svg class="svg-icon xs" viewBox="0 0 24 24">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Voltar</span>
          </a>
          <h1 class="topbar-title">
            {{ ficha() ? 'Ficha Técnica: ' + ficha()!.nomeProduto : 'Carregando Ficha Técnica...' }}
          </h1>
        </div>

        <div class="topbar-right">
          @if (ficha() && produto()) {
            <span class="status-pill purple">
              Venda: R$ {{ produto()!.precoVenda | number:'1.2-2' }}
            </span>
            <span class="status-pill green">
              CMV Total: R$ {{ ficha()!.custoTotal | number:'1.2-2' }}
            </span>
          }
          <button class="btn btn-dark" (click)="mostrarModalAdicionar.set(true)">
            <svg class="svg-icon sm" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Adicionar Insumo à Receita</span>
          </button>
        </div>
      </header>

      @if (erroMsg()) {
        <div class="toast-banner error">
          <span>{{ erroMsg() }}</span>
          <button class="btn btn-sm" (click)="erroMsg.set('')">Fechar</button>
        </div>
      }

      @if (sucessoMsg()) {
        <div class="toast-banner success">
          <span>{{ sucessoMsg() }}</span>
          <button class="btn btn-sm" (click)="sucessoMsg.set('')">Fechar</button>
        </div>
      }

      @if (ficha()) {
        <!-- TABELA DE ITENS DA RECEITA -->
        <div class="table-wrapper" style="margin-top: 20px; margin-bottom: 32px;">
          <table class="ux-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Insumo / Ingrediente</th>
                <th>Unidade de Medida</th>
                <th>Quantidade na Receita</th>
                <th>Custo Subtotal</th>
                <th>Participação no Custo</th>
                <th style="text-align: center;">Ações</th>
              </tr>
            </thead>
            <tbody>
              @if (ficha()!.itens.length === 0) {
                <tr>
                  <td colspan="7" style="text-align: center; padding: 36px; color: #667085;">
                    Esta receita ainda não possui insumos vinculados. Clique em "Adicionar Insumo à Receita".
                  </td>
                </tr>
              } @else {
                @for (item of ficha()!.itens; track item.id; let idx = $index) {
                  <tr [class.row-selected]="editandoItemId() === item.id">
                    <td class="num-cell" style="width: 48px; color: #667085;">{{ idx + 1 }}</td>
                    <td style="font-weight: 600;">{{ item.nomeIngrediente }}</td>
                    <td>
                      <span class="status-pill purple">{{ item.unidadeMedida }}</span>
                    </td>
                    <td class="num-cell">
                      @if (editandoItemId() === item.id) {
                        <div style="display: inline-flex; align-items: center; gap: 6px;">
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            [(ngModel)]="quantidadeEdicao"
                            style="width: 100px; height: 30px; padding: 0 8px; border: 1px solid #ff5a1f; border-radius: 6px;"
                          />
                          <span>{{ sigla(item.unidadeMedida) }}</span>
                        </div>
                      } @else {
                        <strong>{{ item.quantidade | number:'1.0-3' }} {{ sigla(item.unidadeMedida) }}</strong>
                      }
                    </td>
                    <td class="num-cell" style="font-weight: 600;">
                      R$ {{ item.custoSubtotal | number:'1.2-4' }}
                    </td>
                    <td>
                      <span class="status-pill green">
                        {{ percentualCusto(item) | number:'1.0-1' }}%
                      </span>
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                      @if (editandoItemId() === item.id) {
                        <button
                          class="btn btn-sm btn-orange"
                          style="margin-right: 6px;"
                          (click)="salvarEdicaoQuantidade(item)"
                        >
                          Salvar
                        </button>
                        <button class="btn btn-sm" (click)="cancelarEdicao()">
                          Cancelar
                        </button>
                      } @else {
                        <button
                          class="btn btn-sm"
                          style="margin-right: 6px;"
                          (click)="iniciarEdicao(item)"
                        >
                          <svg class="svg-icon xs" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          <span>Alterar Qtd</span>
                        </button>
                        <button
                          class="btn btn-sm"
                          style="color: #b42318;"
                          (click)="removerItem(item)"
                        >
                          <svg class="svg-icon xs" viewBox="0 0 24 24">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Remover</span>
                        </button>
                      }
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          <div class="table-bottom-strip">
            <span
              style="cursor: pointer; font-weight: 600;"
              (click)="mostrarModalAdicionar.set(true)"
            >
              + Adicionar novo insumo à receita
            </span>
            <span>
              Custo Total da Ficha Técnica:
              <strong style="color: #101828;">R$ {{ ficha()!.custoTotal | number:'1.2-2' }}</strong>
            </span>
          </div>
        </div>
      }

      <!-- MODAL ADICIONAR INGREDIENTE -->
      @if (mostrarModalAdicionar()) {
        <div class="modal-backdrop" (click)="mostrarModalAdicionar.set(false)">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Adicionar Insumo à Receita</h2>
              <button class="btn btn-sm" (click)="mostrarModalAdicionar.set(false)">
                <svg class="svg-icon xs" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form (ngSubmit)="adicionarIngrediente()">
              <div class="modal-body">
                <div class="form-field">
                  <label>Selecione o Insumo / Preparo *</label>
                  <select
                    [(ngModel)]="novoIngredienteId"
                    name="ingredienteId"
                    required
                  >
                    <option [ngValue]="null" disabled>Escolha um insumo...</option>
                    @for (ing of ingredientesDisponiveis(); track ing.id) {
                      <option [ngValue]="ing.id">
                        {{ ing.name }} ({{ ing.unidadeMedida }} — R$ {{ ing.custoUnitarioBase | number:'1.4-4' }})
                      </option>
                    }
                  </select>
                </div>

                <div class="form-field">
                  <label>Quantidade Utilizada na Receita *</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    [(ngModel)]="novaQuantidade"
                    name="quantidade"
                    placeholder="Ex: 260"
                    required
                  />
                </div>
              </div>

              <div class="modal-footer">
                <button
                  type="button"
                  class="btn"
                  (click)="mostrarModalAdicionar.set(false)"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  class="btn btn-dark"
                  [disabled]="!novoIngredienteId || !novaQuantidade"
                >
                  Adicionar à Ficha Técnica
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class FichaTecnicaComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fichaService = inject(FichaTecnicaService);
  private readonly ingredienteService = inject(IngredienteService);
  private readonly produtoService = inject(ProdutoService);

  produtoId!: number;
  ficha = signal<FichaTecnicaResponse | null>(null);
  produto = signal<ProdutoResponse | null>(null);
  ingredientesDisponiveis = signal<IngredienteResponse[]>([]);

  mostrarModalAdicionar = signal(false);
  novoIngredienteId: number | null = null;
  novaQuantidade: number | null = null;

  editandoItemId = signal<number | null>(null);
  quantidadeEdicao = 0;

  erroMsg = signal('');
  sucessoMsg = signal('');

  ngOnInit(): void {
    this.produtoId = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarDados();
    this.carregarIngredientes();
  }

  carregarDados(): void {
    this.fichaService.listarPorProduto(this.produtoId).subscribe({
      next: (res) => this.ficha.set(res),
      error: (err) => this.erroMsg.set(this.extrairErro(err)),
    });

    this.produtoService.buscarPorId(this.produtoId).subscribe({
      next: (prod) => this.produto.set(prod),
    });
  }

  carregarIngredientes(): void {
    this.ingredienteService.listar(0, 200).subscribe({
      next: (res) => this.ingredientesDisponiveis.set(res.content || []),
    });
  }

  adicionarIngrediente(): void {
    if (!this.novoIngredienteId || !this.novaQuantidade) return;
    this.erroMsg.set('');
    this.sucessoMsg.set('');

    this.fichaService
      .adicionar(this.produtoId, {
        ingredienteId: this.novoIngredienteId,
        quantidade: this.novaQuantidade,
      })
      .subscribe({
        next: () => {
          this.sucessoMsg.set('Insumo adicionado à ficha técnica!');
          this.novoIngredienteId = null;
          this.novaQuantidade = null;
          this.mostrarModalAdicionar.set(false);
          this.carregarDados();
        },
        error: (err) => this.erroMsg.set(this.extrairErro(err)),
      });
  }

  iniciarEdicao(item: ItemFichaTecnicaResponse): void {
    this.editandoItemId.set(item.id);
    this.quantidadeEdicao = item.quantidade;
  }

  cancelarEdicao(): void {
    this.editandoItemId.set(null);
  }

  salvarEdicaoQuantidade(item: ItemFichaTecnicaResponse): void {
    this.erroMsg.set('');
    this.sucessoMsg.set('');

    this.fichaService
      .atualizarQuantidade(this.produtoId, item.id, {
        ingredienteId: item.ingredienteId,
        quantidade: this.quantidadeEdicao,
      })
      .subscribe({
        next: () => {
          this.sucessoMsg.set(`Quantidade de "${item.nomeIngrediente}" atualizada!`);
          this.editandoItemId.set(null);
          this.carregarDados();
        },
        error: (err) => this.erroMsg.set(this.extrairErro(err)),
      });
  }

  removerItem(item: ItemFichaTecnicaResponse): void {
    if (!confirm(`Remover "${item.nomeIngrediente}" desta receita?`)) return;
    this.erroMsg.set('');
    this.sucessoMsg.set('');

    this.fichaService.deletar(this.produtoId, item.id).subscribe({
      next: () => {
        this.sucessoMsg.set(`"${item.nomeIngrediente}" removido da receita.`);
        this.carregarDados();
      },
      error: (err) => this.erroMsg.set(this.extrairErro(err)),
    });
  }

  percentualCusto(item: ItemFichaTecnicaResponse): number {
    const total = this.ficha()?.custoTotal || 0;
    if (total <= 0) return 0;
    return (item.custoSubtotal / total) * 100;
  }

  sigla(unidade: UnidadeMedida): string {
    if (unidade === 'GRAMA') return 'g';
    if (unidade === 'MILILITRO') return 'ml';
    return 'un';
  }

  private extrairErro(err: any): string {
    if (err?.error?.errors) {
      return Object.values(err.error.errors).join(' | ');
    }
    return err?.error?.detail || err?.error?.message || 'Erro na operação.';
  }
}
