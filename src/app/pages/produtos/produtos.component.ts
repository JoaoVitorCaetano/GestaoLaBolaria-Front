import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProdutoService } from '../../services/produto.service';
import {
  CategoriaProduto,
  ProdutoRequest,
  ProdutoResponse,
} from '../../models/api.models';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="saas-page">
      <!-- TOP BAR -->
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">Produtos</h1>
        </div>
        <div class="topbar-right">
          <button class="icon-btn" title="Atualizar dados" (click)="carregar()">
            <svg class="svg-icon" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
          <button class="btn" (click)="irParaIngredientes()">
            <svg class="svg-icon sm" viewBox="0 0 24 24">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span>Gerenciar Insumos</span>
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

      <!-- ACTION TOOLBAR -->
      <div class="toolbar">
        <div class="toolbar-left">
          <select
            class="select-pill"
            [ngModel]="modoExibicao()"
            (ngModelChange)="modoExibicao.set($event)"
          >
            <option value="table">Visualização em Tabela</option>
            <option value="grid">Visualização em Cards</option>
          </select>

          <select
            class="select-pill"
            [ngModel]="filtroCategoria()"
            (ngModelChange)="alterarFiltroCategoria($event)"
          >
            <option value="TODAS">Filtrar: Todas Categorias</option>
            <option value="CASEIRO_TRADICIONAL">Caseiro Tradicional e Broas</option>
            <option value="VULCAO">Vulcão e Piscininha</option>
            <option value="RECHEADO_FESTA">Tortas G34 (2000ml)</option>
            <option value="POTE">Bolo no Pote</option>
          </select>

          <select
            class="select-pill"
            [ngModel]="ordenacao()"
            (ngModelChange)="ordenacao.set($event)"
          >
            <option value="nome">Ordenar: Nome (A-Z)</option>
            <option value="preco_desc">Ordenar: Maior Preço</option>
            <option value="custo_asc">Ordenar: Menor Custo</option>
            <option value="lucro_desc">Ordenar: Maior Lucro</option>
          </select>
        </div>

        <div class="toolbar-right">
          <div class="search-inline">
            <svg class="svg-icon xs search-icon" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar bolo ou receita..."
              [ngModel]="termoBusca()"
              (ngModelChange)="alterarBusca($event)"
            />
          </div>

          <button class="btn" (click)="exportarCsv()">
            <svg class="svg-icon sm" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Exportar</span>
          </button>

          <button class="btn btn-dark" (click)="abrirNovo()">
            <svg class="svg-icon sm" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      <!-- TABLE VIEW (DESKTOP) -->
      @if (modoExibicao() === 'table') {
        <div class="table-wrapper desktop-table-only">
          <table class="ux-table">
            <thead>
              <tr>
                <th class="col-check">
                  <input
                    type="checkbox"
                    class="ux-checkbox"
                    [checked]="todosDaPaginaSelecionados()"
                    (change)="alternarTodosDaPagina($event)"
                  />
                </th>
                <th>Produto</th>
                <th>Preço de Venda</th>
                <th>Rendimento</th>
                <th>CMV (Custo Receita)</th>
                <th>Lucro Bruto</th>
                <th>Categoria</th>
                <th>Margem</th>
                <th style="text-align: center;">Ações</th>
              </tr>
            </thead>
            <tbody>
              @if (carregando()) {
                <tr>
                  <td colspan="9" style="text-align: center; padding: 36px; color: #667085;">
                    Carregando catálogo de produtos...
                  </td>
                </tr>
              } @else if (produtosPaginados().length === 0) {
                <tr>
                  <td colspan="9" style="text-align: center; padding: 36px; color: #667085;">
                    Nenhum produto encontrado para o filtro selecionado.
                  </td>
                </tr>
              } @else {
                @for (p of produtosPaginados(); track p.id) {
                  <tr [class.row-selected]="estaSelecionado(p.id)">
                    <td class="col-check">
                      <input
                        type="checkbox"
                        class="ux-checkbox"
                        [checked]="estaSelecionado(p.id)"
                        (change)="alternarSelecao(p.id)"
                      />
                    </td>
                    <td>
                      <div class="product-name-cell">
                        <span
                          style="cursor: pointer;"
                          (click)="abrirFichaTecnica(p.id)"
                          title="Clique para abrir a Ficha Técnica"
                        >
                          {{ p.name }}
                        </span>
                      </div>
                    </td>
                    <td class="num-cell">R$ {{ p.precoVenda | number:'1.2-2' }}</td>
                    <td class="num-cell">{{ p.redimentoFatias }} fatias</td>
                    <td class="num-cell">R$ {{ (p.custoTotalReceita || 0) | number:'1.2-2' }}</td>
                    <td class="num-cell" style="font-weight: 600;">
                      R$ {{ calcularLucro(p) | number:'1.2-2' }}
                    </td>
                    <td>
                      <span class="status-pill" [ngClass]="classeCategoria(p.categoriaProduto)">
                        {{ formatarCategoria(p.categoriaProduto) }}
                      </span>
                    </td>
                    <td>
                      <span class="rating-cell">
                        <svg class="svg-icon xs" style="color: #f59e0b; fill: #f59e0b;" viewBox="0 0 24 24">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span>{{ calcularMargemNota(p) }}</span>
                      </span>
                    </td>
                    <td style="text-align: center; white-space: nowrap;">
                      <button
                        class="btn btn-sm"
                        style="margin-right: 6px;"
                        (click)="abrirFichaTecnica(p.id)"
                        title="Ver e editar Ficha Técnica"
                      >
                        <svg class="svg-icon xs" viewBox="0 0 24 24">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <span>Receita</span>
                      </button>
                      <button
                        class="btn btn-sm"
                        style="margin-right: 6px;"
                        (click)="abrirEdicao(p)"
                        title="Editar produto"
                      >
                        <svg class="svg-icon xs" viewBox="0 0 24 24">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        class="btn btn-sm"
                        style="color: #b42318;"
                        (click)="excluir(p)"
                        title="Excluir produto"
                      >
                        <svg class="svg-icon xs" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          <div class="table-bottom-strip">
            <span style="cursor: pointer; font-weight: 600;" (click)="abrirNovo()">
              + Adicionar novo produto ao catálogo
            </span>
            <span>Total exibido: {{ produtosFiltrados().length }} produtos</span>
          </div>
        </div>
      }

      <!-- MINIMALIST CARDS (AUTOMATIC ON MOBILE OR WHEN GRID IS SELECTED) -->
      <div [ngClass]="modoExibicao() === 'grid' ? 'cards-grid-view' : 'mobile-cards-list'">
        @for (p of produtosPaginados(); track p.id) {
          <div class="min-card">
            <div class="min-card-top">
              <span
                class="min-card-title"
                style="cursor: pointer;"
                (click)="abrirFichaTecnica(p.id)"
              >
                {{ p.name }}
              </span>
              <span class="min-card-tag">{{ formatarCategoria(p.categoriaProduto) }}</span>
            </div>

            <div class="min-card-metrics">
              <div class="min-metric">
                <span class="min-metric-label">Venda</span>
                <span class="min-metric-val">R$ {{ p.precoVenda | number:'1.2-2' }}</span>
              </div>
              <div class="min-metric">
                <span class="min-metric-label">CMV</span>
                <span class="min-metric-val">R$ {{ (p.custoTotalReceita || 0) | number:'1.2-2' }}</span>
              </div>
              <div class="min-metric">
                <span class="min-metric-label">Lucro ({{ calcularMargemNota(p) }})</span>
                <span class="min-metric-val positive">R$ {{ calcularLucro(p) | number:'1.2-2' }}</span>
              </div>
            </div>

            <div class="min-card-bottom">
              <span class="min-card-sub">{{ p.redimentoFatias }} fatias/unid</span>
              <div class="min-card-actions">
                <button class="min-btn" (click)="abrirFichaTecnica(p.id)">
                  <span>Receita</span>
                </button>
                <button class="min-btn" (click)="abrirEdicao(p)" title="Editar">
                  <svg class="svg-icon xs" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button class="min-btn danger" (click)="excluir(p)" title="Excluir">
                  <svg class="svg-icon xs" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- FLOATING BULK ACTION BAR -->
      @if (selecionados().size > 0) {
        <div class="floating-action-bar">
          <span class="floating-count">{{ selecionados().size }} Selecionado(s)</span>

          @if (selecionados().size === 1) {
            <button class="btn btn-sm" (click)="abrirFichaDoSelecionado()">
              <svg class="svg-icon xs" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Ficha Técnica</span>
            </button>
            <button class="btn btn-sm" (click)="editarSelecionado()">
              <svg class="svg-icon xs" viewBox="0 0 24 24">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span>Editar</span>
            </button>
          }

          <button class="btn btn-sm" style="color: #b42318;" (click)="excluirSelecionados()">
            <svg class="svg-icon xs" viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>Excluir</span>
          </button>

          <button class="btn btn-sm" (click)="limparSelecao()" title="Limpar seleção">
            <svg class="svg-icon xs" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      }

      <!-- PAGINATION BAR -->
      <div class="pagination-bar">
        <div class="pagination-left">
          <span>Exibir por página</span>
          <select
            class="select-pill"
            style="height: 32px;"
            [ngModel]="itensPorPagina()"
            (ngModelChange)="alterarItensPorPagina($event)"
          >
            <option [ngValue]="10">10</option>
            <option [ngValue]="20">20</option>
            <option [ngValue]="50">50</option>
            <option [ngValue]="100">100</option>
          </select>
        </div>

        <div class="pagination-pages">
          <button
            class="page-btn"
            [disabled]="paginaAtual() === 1"
            (click)="irParaPagina(1)"
          >
            «
          </button>
          <button
            class="page-btn"
            [disabled]="paginaAtual() === 1"
            (click)="irParaPagina(paginaAtual() - 1)"
          >
            ‹
          </button>

          @for (pg of paginasVisiveis(); track pg) {
            <button
              class="page-btn"
              [class.active]="pg === paginaAtual()"
              (click)="irParaPagina(pg)"
            >
              {{ pg }}
            </button>
          }

          <button
            class="page-btn"
            [disabled]="paginaAtual() >= totalPaginas()"
            (click)="irParaPagina(paginaAtual() + 1)"
          >
            ›
          </button>
          <button
            class="page-btn"
            [disabled]="paginaAtual() >= totalPaginas()"
            (click)="irParaPagina(totalPaginas())"
          >
            »
          </button>
        </div>

        <div class="pagination-right">
          <span>Ir para página</span>
          <input
            type="number"
            class="goto-input"
            min="1"
            [max]="totalPaginas()"
            [(ngModel)]="inputIrPagina"
            (keyup.enter)="irParaPagina(inputIrPagina)"
          />
          <button class="btn btn-sm" (click)="irParaPagina(inputIrPagina)">Ir ›</button>
        </div>
      </div>

      <!-- MODAL CRIAR / EDITAR PRODUTO -->
      @if (mostrarFormulario()) {
        <div class="modal-backdrop" (click)="fecharFormulario()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editandoId() ? 'Editar Produto' : 'Novo Produto' }}</h2>
              <button class="btn btn-sm" (click)="fecharFormulario()">
                <svg class="svg-icon xs" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form (ngSubmit)="salvar()">
              <div class="modal-body">
                <div class="form-field">
                  <label>Nome do Produto *</label>
                  <input
                    type="text"
                    [(ngModel)]="form.name"
                    name="name"
                    placeholder="Ex: Bolo de Cenoura Vulcão"
                    required
                  />
                </div>

                <div class="form-field">
                  <label>Categoria *</label>
                  <select [(ngModel)]="form.categoriaProduto" name="categoriaProduto" required>
                    <option value="CASEIRO_TRADICIONAL">Caseiro Tradicional e Broas</option>
                    <option value="VULCAO">Vulcão e Piscininha</option>
                    <option value="RECHEADO_FESTA">Tortas e Festa (G34)</option>
                    <option value="POTE">Bolo no Pote</option>
                  </select>
                </div>

                <div class="form-row-2">
                  <div class="form-field">
                    <label>Preço de Venda (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      [(ngModel)]="form.precoVenda"
                      name="precoVenda"
                      required
                    />
                  </div>

                  <div class="form-field">
                    <label>Rendimento (Fatias/Unid) *</label>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      max="99"
                      [(ngModel)]="form.redimentoFatias"
                      name="redimentoFatias"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn" (click)="fecharFormulario()">
                  Cancelar
                </button>
                <button type="submit" class="btn btn-dark">
                  {{ editandoId() ? 'Salvar Alterações' : 'Cadastrar Produto' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProdutosComponent implements OnInit {
  private readonly service = inject(ProdutoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  produtos = signal<ProdutoResponse[]>([]);
  carregando = signal(false);
  mostrarFormulario = signal(false);
  modoExibicao = signal<'table' | 'grid'>('table');
  editandoId = signal<number | null>(null);
  erroMsg = signal('');
  sucessoMsg = signal('');

  filtroCategoria = signal<string>('TODAS');
  termoBusca = signal<string>('');
  ordenacao = signal<string>('nome');

  paginaAtual = signal<number>(1);
  itensPorPagina = signal<number>(10);
  inputIrPagina = 1;

  selecionados = signal<Set<number>>(new Set());

  form: ProdutoRequest = {
    name: '',
    categoriaProduto: 'CASEIRO_TRADICIONAL',
    precoVenda: 32,
    redimentoFatias: 12,
  };

  produtosFiltrados = computed(() => {
    let lista = [...this.produtos()];
    const cat = this.filtroCategoria();
    const busca = this.termoBusca().trim().toLowerCase();
    const ord = this.ordenacao();

    if (cat !== 'TODAS') {
      lista = lista.filter((p) => p.categoriaProduto === cat);
    }

    if (busca) {
      lista = lista.filter((p) => p.name.toLowerCase().includes(busca));
    }

    lista.sort((a, b) => {
      if (ord === 'preco_desc') return b.precoVenda - a.precoVenda;
      if (ord === 'custo_asc')
        return (a.custoTotalReceita || 0) - (b.custoTotalReceita || 0);
      if (ord === 'lucro_desc')
        return this.calcularLucro(b) - this.calcularLucro(a);
      return a.name.localeCompare(b.name);
    });

    return lista;
  });

  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.produtosFiltrados().length / this.itensPorPagina()))
  );

  produtosPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina();
    return this.produtosFiltrados().slice(inicio, inicio + this.itensPorPagina());
  });

  paginasVisiveis = computed(() => {
    const total = this.totalPaginas();
    const atual = this.paginaAtual();
    const pags: number[] = [];
    const ini = Math.max(1, atual - 2);
    const fim = Math.min(total, ini + 4);
    for (let i = ini; i <= fim; i++) pags.push(i);
    return pags;
  });

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['cat']) {
        this.filtroCategoria.set(params['cat']);
        this.paginaAtual.set(1);
      }
    });
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar(0, 200).subscribe({
      next: (res) => {
        this.produtos.set(res.content || []);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erroMsg.set(this.extrairErro(err));
        this.carregando.set(false);
      },
    });
  }

  alterarFiltroCategoria(cat: string): void {
    this.filtroCategoria.set(cat);
    this.paginaAtual.set(1);
  }

  alterarBusca(termo: string): void {
    this.termoBusca.set(termo);
    this.paginaAtual.set(1);
  }

  alterarItensPorPagina(qtd: number): void {
    this.itensPorPagina.set(Number(qtd));
    this.paginaAtual.set(1);
  }

  irParaPagina(p: number): void {
    const alvo = Math.min(Math.max(1, Number(p) || 1), this.totalPaginas());
    this.paginaAtual.set(alvo);
    this.inputIrPagina = alvo;
  }

  estaSelecionado(id: number): boolean {
    return this.selecionados().has(id);
  }

  alternarSelecao(id: number): void {
    const novo = new Set(this.selecionados());
    if (novo.has(id)) novo.delete(id);
    else novo.add(id);
    this.selecionados.set(novo);
  }

  todosDaPaginaSelecionados(): boolean {
    const pag = this.produtosPaginados();
    return pag.length > 0 && pag.every((p) => this.selecionados().has(p.id));
  }

  alternarTodosDaPagina(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const novo = new Set(this.selecionados());
    for (const p of this.produtosPaginados()) {
      if (checked) novo.add(p.id);
      else novo.delete(p.id);
    }
    this.selecionados.set(novo);
  }

  limparSelecao(): void {
    this.selecionados.set(new Set());
  }

  abrirFichaDoSelecionado(): void {
    const id = Array.from(this.selecionados())[0];
    if (id) this.abrirFichaTecnica(id);
  }

  editarSelecionado(): void {
    const id = Array.from(this.selecionados())[0];
    const prod = this.produtos().find((p) => p.id === id);
    if (prod) this.abrirEdicao(prod);
  }

  excluirSelecionados(): void {
    const ids = Array.from(this.selecionados());
    if (!ids.length) return;
    if (!confirm(`Deseja realmente excluir ${ids.length} produto(s) selecionado(s)?`))
      return;

    let concluidos = 0;
    for (const id of ids) {
      this.service.deletar(id).subscribe({
        next: () => {
          concluidos++;
          if (concluidos === ids.length) {
            this.limparSelecao();
            this.sucessoMsg.set('Produtos selecionados excluídos com sucesso.');
            this.carregar();
          }
        },
        error: (err) => this.erroMsg.set(this.extrairErro(err)),
      });
    }
  }

  abrirNovo(): void {
    this.editandoId.set(null);
    this.form = {
      name: '',
      categoriaProduto: 'CASEIRO_TRADICIONAL',
      precoVenda: 34,
      redimentoFatias: 12,
    };
    this.mostrarFormulario.set(true);
  }

  abrirEdicao(p: ProdutoResponse): void {
    this.editandoId.set(p.id);
    this.form = {
      name: p.name,
      categoriaProduto: p.categoriaProduto,
      precoVenda: p.precoVenda,
      redimentoFatias: p.redimentoFatias,
    };
    this.mostrarFormulario.set(true);
  }

  fecharFormulario(): void {
    this.mostrarFormulario.set(false);
    this.editandoId.set(null);
  }

  salvar(): void {
    this.erroMsg.set('');
    this.sucessoMsg.set('');
    const id = this.editandoId();

    const req$ = id
      ? this.service.atualizar(id, this.form)
      : this.service.criar(this.form);

    req$.subscribe({
      next: (salvo) => {
        this.sucessoMsg.set(
          id ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!'
        );
        this.fecharFormulario();
        this.carregar();
        if (!id && salvo?.id) {
          this.router.navigate(['/produtos', salvo.id, 'ficha-tecnica']);
        }
      },
      error: (err) => this.erroMsg.set(this.extrairErro(err)),
    });
  }

  excluir(p: ProdutoResponse): void {
    if (!confirm(`Deseja realmente excluir o produto "${p.name}"?`)) return;
    this.erroMsg.set('');
    this.service.deletar(p.id).subscribe({
      next: () => {
        this.sucessoMsg.set(`Produto "${p.name}" excluído.`);
        this.carregar();
      },
      error: (err) => this.erroMsg.set(this.extrairErro(err)),
    });
  }

  abrirFichaTecnica(produtoId: number): void {
    this.router.navigate(['/produtos', produtoId, 'ficha-tecnica']);
  }

  irParaIngredientes(): void {
    this.router.navigate(['/ingredientes']);
  }

  calcularLucro(p: ProdutoResponse): number {
    return (p.precoVenda || 0) - (p.custoTotalReceita || 0);
  }

  calcularMargemNota(p: ProdutoResponse): string {
    if (!p.precoVenda || p.precoVenda <= 0) return '0%';
    const margem = (this.calcularLucro(p) / p.precoVenda) * 100;
    return `${Math.max(0, margem).toFixed(0)}%`;
  }

  formatarCategoria(cat: CategoriaProduto): string {
    const mapa: Record<CategoriaProduto, string> = {
      CASEIRO_TRADICIONAL: 'Caseiro / Broa',
      VULCAO: 'Vulcão / Piscininha',
      RECHEADO_FESTA: 'Torta G34',
      POTE: 'Bolo no Pote',
    };
    return mapa[cat] || cat;
  }

  classeCategoria(cat: CategoriaProduto): string {
    const mapa: Record<CategoriaProduto, string> = {
      CASEIRO_TRADICIONAL: 'purple',
      VULCAO: 'yellow',
      RECHEADO_FESTA: 'red',
      POTE: 'green',
    };
    return mapa[cat] || 'purple';
  }

  exportarCsv(): void {
    const linhas = [
      ['ID', 'Produto', 'Categoria', 'Preco Venda', 'Custo Receita', 'Lucro Bruto', 'Fatias'].join(';'),
      ...this.produtosFiltrados().map((p) =>
        [
          p.id,
          `"${p.name}"`,
          p.categoriaProduto,
          p.precoVenda.toFixed(2),
          (p.custoTotalReceita || 0).toFixed(2),
          this.calcularLucro(p).toFixed(2),
          p.redimentoFatias,
        ].join(';')
      ),
    ].join('\n');

    const blob = new Blob([linhas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalogo-produtos-labolaria.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  private extrairErro(err: any): string {
    if (err?.error?.errors) {
      return Object.values(err.error.errors).join(' | ');
    }
    return err?.error?.detail || err?.error?.message || 'Erro ao comunicar com a API.';
  }
}
