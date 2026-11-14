import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
          <button class="btn btn-dark" (click)="abrirModalAdicionar()">
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
        <!-- TABELA DE ITENS DA RECEITA (DESKTOP) -->
        <div class="table-wrapper desktop-table-only" style="margin-top: 20px; margin-bottom: 32px;">
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
              (click)="abrirModalAdicionar()"
            >
              + Adicionar novo insumo à receita
            </span>
            <span>
              Custo Total da Ficha Técnica:
              <strong style="color: #101828;">R$ {{ ficha()!.custoTotal | number:'1.2-2' }}</strong>
            </span>
          </div>
        </div>

        <!-- CARDS MINIMALISTAS (MOBILE) -->
        <div class="mobile-cards-list" style="margin-top: 12px; margin-bottom: 24px;">
          @for (item of ficha()!.itens; track item.id) {
            <div class="min-card">
              <div class="min-card-top">
                <span class="min-card-title">{{ item.nomeIngrediente }}</span>
                <span class="min-card-tag">{{ item.unidadeMedida }}</span>
              </div>

              <div class="min-card-metrics">
                <div class="min-metric">
                  <span class="min-metric-label">Quantidade</span>
                  @if (editandoItemId() === item.id) {
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      [(ngModel)]="quantidadeEdicao"
                      style="width: 80px; height: 26px; padding: 0 6px; border: 1px solid #ff5a1f; border-radius: 5px; font-size: 12px;"
                    />
                  } @else {
                    <span class="min-metric-val">
                      {{ item.quantidade | number:'1.0-3' }} {{ sigla(item.unidadeMedida) }}
                    </span>
                  }
                </div>
                <div class="min-metric">
                  <span class="min-metric-label">Subtotal</span>
                  <span class="min-metric-val">R$ {{ item.custoSubtotal | number:'1.2-4' }}</span>
                </div>
                <div class="min-metric">
                  <span class="min-metric-label">Part. Custo</span>
                  <span class="min-metric-val positive">{{ percentualCusto(item) | number:'1.0-1' }}%</span>
                </div>
              </div>

              <div class="min-card-bottom">
                <div class="min-card-actions">
                  @if (editandoItemId() === item.id) {
                    <button class="min-btn" style="color: #ff5a1f; border-color: #ff5a1f;" (click)="salvarEdicaoQuantidade(item)">
                      Salvar
                    </button>
                    <button class="min-btn" (click)="cancelarEdicao()">Cancelar</button>
                  } @else {
                    <button class="min-btn" (click)="iniciarEdicao(item)">Alterar Qtd</button>
                    <button class="min-btn danger" (click)="removerItem(item)" title="Remover">
                      <svg class="svg-icon xs" viewBox="0 0 24 24">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- MODAL ADICIONAR INGREDIENTE (COM SELETOR PESQUISÁVEL COMPACTO QUE NÃO SOBE/QUEBRA) -->
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
                  <input
                    type="text"
                    placeholder="Filtrar insumo pelo nome..."
                    [ngModel]="buscaInsumoModal()"
                    (ngModelChange)="buscaInsumoModal.set($event)"
                    name="buscaInsumo"
                    autocomplete="off"
                  />

                  <div class="insumo-picker-list">
                    @for (ing of ingredientesFiltradosModal(); track ing.id) {
                      <button
                        type="button"
                        class="insumo-picker-item"
                        [class.selected]="novoIngredienteId === ing.id"
                        (click)="selecionarInsumoModal(ing)"
                      >
                        <span class="insumo-picker-name">{{ ing.name }}</span>
                        <span class="insumo-picker-meta">
                          {{ sigla(ing.unidadeMedida) }} · R$ {{ ing.custoUnitarioBase | number:'1.4-4' }}
                        </span>
                      </button>
                    } @empty {
                      <div class="insumo-picker-empty">Nenhum insumo encontrado.</div>
                    }
                  </div>
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
  styles: [
    `
      .insumo-picker-list {
        max-height: 176px;
        overflow-y: auto;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background: #ffffff;
        display: flex;
        flex-direction: column;
      }

      .insumo-picker-item {
        width: 100%;
        border: none;
        border-bottom: 1px solid #f2f4f7;
        background: transparent;
        padding: 8px 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        text-align: left;
        cursor: pointer;
        font-size: 12.5px;
        color: var(--text-primary);
        transition: background 0.12s ease;
      }

      .insumo-picker-item:last-child {
        border-bottom: none;
      }

      .insumo-picker-item:hover {
        background: #f8f9fb;
      }

      .insumo-picker-item.selected {
        background: #fff4ed;
        color: #c2410c;
        font-weight: 600;
      }

      .insumo-picker-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .insumo-picker-meta {
        font-size: 11px;
        color: var(--text-muted);
        white-space: nowrap;
        flex-shrink: 0;
      }

      .insumo-picker-empty {
        padding: 14px;
        text-align: center;
        font-size: 12px;
        color: var(--text-muted);
      }
    `,
  ],
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
  buscaInsumoModal = signal('');
  novoIngredienteId: number | null = null;
  novaQuantidade: number | null = null;

  ingredientesFiltradosModal = computed(() => {
    const termo = this.buscaInsumoModal().trim().toLowerCase();
    const lista = this.ingredientesDisponiveis();
    if (!termo) return lista;
    return lista.filter((i) => i.name.toLowerCase().includes(termo));
  });

  editandoItemId = signal<number | null>(null);
  quantidadeEdicao = 0;

  erroMsg = signal('');
  sucessoMsg = signal('');

  ngOnInit(): void {
    this.produtoId = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarDados();
    this.carregarIngredientes();
  }

  abrirModalAdicionar(): void {
    this.buscaInsumoModal.set('');
    this.novoIngredienteId = null;
    this.novaQuantidade = null;
    this.mostrarModalAdicionar.set(true);
  }

  selecionarInsumoModal(ing: IngredienteResponse): void {
    this.novoIngredienteId = ing.id;
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
          this.buscaInsumoModal.set('');
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
