import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IngredienteService } from '../../services/ingrediente.service';
import {
  IngredienteRequest,
  IngredienteResponse,
  UnidadeMedida,
} from '../../models/api.models';

@Component({
  selector: 'app-ingredientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="saas-page">
      <!-- TOP BAR -->
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">Estoque de Insumos</h1>
        </div>
        <div class="topbar-right">
          <button class="icon-btn" title="Atualizar estoque" (click)="carregar()">
            <svg class="svg-icon" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
          <button class="btn" (click)="irParaProdutos()">
            <svg class="svg-icon sm" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>Ver Produtos</span>
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

      <!-- TOOLBAR -->
      <div class="toolbar">
        <div class="toolbar-left">
          <select
            class="select-pill"
            [ngModel]="filtroUnidade()"
            (ngModelChange)="alterarFiltroUnidade($event)"
          >
            <option value="TODAS">Filtrar: Todas Unidades</option>
            <option value="GRAMA">Grama (g)</option>
            <option value="MILILITRO">Mililitro (ml)</option>
            <option value="UNIDADE">Unidade (un)</option>
          </select>

          <select
            class="select-pill"
            [ngModel]="ordenacao()"
            (ngModelChange)="ordenacao.set($event)"
          >
            <option value="nome">Ordenar: Nome (A-Z)</option>
            <option value="custo_desc">Ordenar: Maior Custo Unit.</option>
            <option value="estoque_asc">Ordenar: Menor Estoque</option>
          </select>

          <div class="toggle-label" (click)="mostrarStats.set(!mostrarStats())">
            <span>Mostrar Estatísticas</span>
            <div class="toggle-switch" [class.active]="mostrarStats()">
              <div class="toggle-knob"></div>
            </div>
          </div>
        </div>

        <div class="toolbar-right">
          <div class="search-inline">
            <svg class="svg-icon xs search-icon" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar insumo ou preparo..."
              [ngModel]="termoBusca()"
              (ngModelChange)="alterarBusca($event)"
            />
          </div>

          <button class="btn btn-dark" (click)="abrirNovo()">
            <svg class="svg-icon sm" viewBox="0 0 24 24">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Novo Insumo</span>
          </button>
        </div>
      </div>

      <!-- 4-COLUMN KPI STATS (EXCLUSIVO PARA INSUMOS) -->
      @if (mostrarStats()) {
        <div class="stats-strip">
          <div class="stat-cell">
            <div class="stat-header">
              <span>Total de Insumos</span>
              <svg class="svg-icon xs stat-info-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div class="stat-value">{{ ingredientesFiltrados().length }}</div>
            <div class="stat-footer">
              <span>cadastrados na base</span>
              <span class="stat-badge">+ {{ ingredientes().length }} itens</span>
            </div>
          </div>

          <div class="stat-cell">
            <div class="stat-header">
              <span>Itens em Estoque Normal</span>
              <svg class="svg-icon xs stat-info-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div class="stat-value">{{ qtdEmEstoque() }}</div>
            <div class="stat-footer">
              <span>disponibilidade imediata</span>
              <span class="stat-badge">In Stock</span>
            </div>
          </div>

          <div class="stat-cell">
            <div class="stat-header">
              <span>Itens para Reposição</span>
              <svg class="svg-icon xs stat-info-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div class="stat-value">{{ qtdBaixoEstoque() }}</div>
            <div class="stat-footer">
              <span>abaixo do mínimo</span>
              <span class="stat-badge warn">Restock</span>
            </div>
          </div>

          <div class="stat-cell">
            <div class="stat-header">
              <span>Valor Estimado em Estoque</span>
              <svg class="svg-icon xs stat-info-icon" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div class="stat-value">R$ {{ valorTotalEstoque() | number:'1.2-2' }}</div>
            <div class="stat-footer">
              <span>custo imobilizado</span>
              <span class="stat-badge">Ativo</span>
            </div>
          </div>
        </div>
      }

      <!-- TABLE -->
      <div class="table-wrapper">
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
              <th>Insumo / Ingrediente</th>
              <th>Custo Unitário Base</th>
              <th>Custo por 1000 (kg/L)</th>
              <th>Estoque Atual</th>
              <th>Unidade</th>
              <th>Status</th>
              <th style="text-align: center;">Ações</th>
            </tr>
          </thead>
          <tbody>
            @if (carregando()) {
              <tr>
                <td colspan="8" style="text-align: center; padding: 36px; color: #667085;">
                  Carregando estoque de insumos...
                </td>
              </tr>
            } @else if (ingredientesPaginados().length === 0) {
              <tr>
                <td colspan="8" style="text-align: center; padding: 36px; color: #667085;">
                  Nenhum insumo encontrado.
                </td>
              </tr>
            } @else {
              @for (item of ingredientesPaginados(); track item.id) {
                <tr [class.row-selected]="estaSelecionado(item.id)">
                  <td class="col-check">
                    <input
                      type="checkbox"
                      class="ux-checkbox"
                      [checked]="estaSelecionado(item.id)"
                      (change)="alternarSelecao(item.id)"
                    />
                  </td>
                  <td>
                    <span style="font-weight: 600;">{{ item.name }}</span>
                  </td>
                  <td class="num-cell">
                    R$ {{ item.custoUnitarioBase | number:'1.4-4' }} / {{ sigla(item.unidadeMedida) }}
                  </td>
                  <td class="num-cell">
                    @if (item.unidadeMedida === 'UNIDADE') {
                      R$ {{ item.custoUnitarioBase | number:'1.2-2' }} / un
                    } @else {
                      R$ {{ (item.custoUnitarioBase * 1000) | number:'1.2-2' }} / {{ item.unidadeMedida === 'GRAMA' ? 'kg' : 'L' }}
                    }
                  </td>
                  <td class="num-cell">
                    {{ item.estoqueAtual | number:'1.0-3' }} {{ sigla(item.unidadeMedida) }}
                  </td>
                  <td>
                    <span class="status-pill purple">{{ item.unidadeMedida }}</span>
                  </td>
                  <td>
                    <span class="status-pill" [ngClass]="statusEstoqueClasse(item)">
                      {{ statusEstoqueTexto(item) }}
                    </span>
                  </td>
                  <td style="text-align: center; white-space: nowrap;">
                    <button
                      class="btn btn-sm"
                      style="margin-right: 6px;"
                      (click)="abrirEdicao(item)"
                      title="Editar insumo"
                    >
                      <svg class="svg-icon xs" viewBox="0 0 24 24">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Editar</span>
                    </button>
                    <button
                      class="btn btn-sm"
                      style="color: #b42318;"
                      (click)="excluir(item)"
                      title="Excluir insumo"
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
            + Cadastrar novo insumo
          </span>
          <span>Total exibido: {{ ingredientesFiltrados().length }} insumos</span>
        </div>
      </div>

      <!-- FLOATING SELECTION BAR -->
      @if (selecionados().size > 0) {
        <div class="floating-action-bar">
          <span class="floating-count">{{ selecionados().size }} Selecionado(s)</span>
          @if (selecionados().size === 1) {
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
          <button class="page-btn" [disabled]="paginaAtual() === 1" (click)="irParaPagina(1)">«</button>
          <button class="page-btn" [disabled]="paginaAtual() === 1" (click)="irParaPagina(paginaAtual() - 1)">‹</button>
          @for (pg of paginasVisiveis(); track pg) {
            <button
              class="page-btn"
              [class.active]="pg === paginaAtual()"
              (click)="irParaPagina(pg)"
            >
              {{ pg }}
            </button>
          }
          <button class="page-btn" [disabled]="paginaAtual() >= totalPaginas()" (click)="irParaPagina(paginaAtual() + 1)">›</button>
          <button class="page-btn" [disabled]="paginaAtual() >= totalPaginas()" (click)="irParaPagina(totalPaginas())">»</button>
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

      <!-- MODAL NOVO / EDITAR INGREDIENTE -->
      @if (mostrarFormulario()) {
        <div class="modal-backdrop" (click)="fecharFormulario()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editandoId() ? 'Editar Insumo' : 'Novo Insumo' }}</h2>
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
                  <label>Nome do Insumo *</label>
                  <input
                    type="text"
                    [(ngModel)]="form.name"
                    name="name"
                    placeholder="Ex: Farinha de Trigo"
                    required
                  />
                </div>

                <div class="form-field">
                  <label>Unidade de Medida Base *</label>
                  <select [(ngModel)]="form.unidadeMedida" name="unidadeMedida" required>
                    <option value="GRAMA">GRAMA (g)</option>
                    <option value="MILILITRO">MILILITRO (ml)</option>
                    <option value="UNIDADE">UNIDADE (un)</option>
                  </select>
                </div>

                <div class="form-row-2">
                  <div class="form-field">
                    <label>Custo Unitário Base (R$) *</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      [(ngModel)]="form.custoUnitarioBase"
                      name="custoUnitarioBase"
                      required
                    />
                  </div>

                  <div class="form-field">
                    <label>Estoque Atual *</label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      [(ngModel)]="form.estoqueAtual"
                      name="estoqueAtual"
                      required
                    />
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn" (click)="fecharFormulario()">Cancelar</button>
                <button type="submit" class="btn btn-dark">
                  {{ editandoId() ? 'Salvar Alterações' : 'Cadastrar Insumo' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class IngredientesComponent implements OnInit {
  private readonly service = inject(IngredienteService);
  private readonly router = inject(Router);

  ingredientes = signal<IngredienteResponse[]>([]);
  carregando = signal(false);
  mostrarFormulario = signal(false);
  mostrarStats = signal(true);
  editandoId = signal<number | null>(null);
  erroMsg = signal('');
  sucessoMsg = signal('');

  filtroUnidade = signal<string>('TODAS');
  termoBusca = signal<string>('');
  ordenacao = signal<string>('nome');

  paginaAtual = signal<number>(1);
  itensPorPagina = signal<number>(10);
  inputIrPagina = 1;

  selecionados = signal<Set<number>>(new Set());

  form: IngredienteRequest = {
    name: '',
    unidadeMedida: 'GRAMA',
    custoUnitarioBase: 0,
    estoqueAtual: 0,
  };

  ingredientesFiltrados = computed(() => {
    let lista = [...this.ingredientes()];
    const un = this.filtroUnidade();
    const busca = this.termoBusca().trim().toLowerCase();
    const ord = this.ordenacao();

    if (un !== 'TODAS') {
      lista = lista.filter((i) => i.unidadeMedida === un);
    }

    if (busca) {
      lista = lista.filter((i) => i.name.toLowerCase().includes(busca));
    }

    lista.sort((a, b) => {
      if (ord === 'custo_desc') return b.custoUnitarioBase - a.custoUnitarioBase;
      if (ord === 'estoque_asc') return a.estoqueAtual - b.estoqueAtual;
      return a.name.localeCompare(b.name);
    });

    return lista;
  });

  totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.ingredientesFiltrados().length / this.itensPorPagina()))
  );

  ingredientesPaginados = computed(() => {
    const ini = (this.paginaAtual() - 1) * this.itensPorPagina();
    return this.ingredientesFiltrados().slice(ini, ini + this.itensPorPagina());
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

  qtdEmEstoque = computed(
    () => this.ingredientesFiltrados().filter((i) => this.estoqueNormal(i)).length
  );

  qtdBaixoEstoque = computed(
    () => this.ingredientesFiltrados().filter((i) => !this.estoqueNormal(i)).length
  );

  valorTotalEstoque = computed(() =>
    this.ingredientesFiltrados().reduce(
      (acc, i) => acc + (i.custoUnitarioBase || 0) * (i.estoqueAtual || 0),
      0
    )
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.service.listar(0, 200).subscribe({
      next: (res) => {
        this.ingredientes.set(res.content || []);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erroMsg.set(this.extrairErro(err));
        this.carregando.set(false);
      },
    });
  }

  alterarFiltroUnidade(un: string): void {
    this.filtroUnidade.set(un);
    this.paginaAtual.set(1);
  }

  alterarBusca(b: string): void {
    this.termoBusca.set(b);
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
    const pag = this.ingredientesPaginados();
    return pag.length > 0 && pag.every((i) => this.selecionados().has(i.id));
  }

  alternarTodosDaPagina(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const novo = new Set(this.selecionados());
    for (const item of this.ingredientesPaginados()) {
      if (checked) novo.add(item.id);
      else novo.delete(item.id);
    }
    this.selecionados.set(novo);
  }

  limparSelecao(): void {
    this.selecionados.set(new Set());
  }

  editarSelecionado(): void {
    const id = Array.from(this.selecionados())[0];
    const item = this.ingredientes().find((i) => i.id === id);
    if (item) this.abrirEdicao(item);
  }

  excluirSelecionados(): void {
    const ids = Array.from(this.selecionados());
    if (!ids.length) return;
    if (!confirm(`Deseja realmente excluir ${ids.length} insumo(s)?`)) return;

    let concluidos = 0;
    for (const id of ids) {
      this.service.deletar(id).subscribe({
        next: () => {
          concluidos++;
          if (concluidos === ids.length) {
            this.limparSelecao();
            this.sucessoMsg.set('Insumos excluídos com sucesso.');
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
      unidadeMedida: 'GRAMA',
      custoUnitarioBase: 0.01,
      estoqueAtual: 1000,
    };
    this.mostrarFormulario.set(true);
  }

  abrirEdicao(item: IngredienteResponse): void {
    this.editandoId.set(item.id);
    this.form = {
      name: item.name,
      unidadeMedida: item.unidadeMedida,
      custoUnitarioBase: item.custoUnitarioBase,
      estoqueAtual: item.estoqueAtual,
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
      next: () => {
        this.sucessoMsg.set(
          id
            ? 'Insumo atualizado com sucesso!'
            : 'Insumo cadastrado com sucesso!'
        );
        this.fecharFormulario();
        this.carregar();
      },
      error: (err) => this.erroMsg.set(this.extrairErro(err)),
    });
  }

  excluir(item: IngredienteResponse): void {
    if (!confirm(`Deseja realmente excluir "${item.name}"?`)) return;
    this.erroMsg.set('');
    this.service.deletar(item.id).subscribe({
      next: () => {
        this.sucessoMsg.set(`Insumo "${item.name}" excluído.`);
        this.carregar();
      },
      error: (err) => this.erroMsg.set(this.extrairErro(err)),
    });
  }

  irParaProdutos(): void {
    this.router.navigate(['/produtos']);
  }

  sigla(unidade: UnidadeMedida): string {
    if (unidade === 'GRAMA') return 'g';
    if (unidade === 'MILILITRO') return 'ml';
    return 'un';
  }

  private estoqueNormal(item: IngredienteResponse): boolean {
    if (!item.estoqueAtual || item.estoqueAtual <= 0) return false;
    if (item.unidadeMedida === 'UNIDADE' && item.estoqueAtual < 20) return false;
    if (item.unidadeMedida !== 'UNIDADE' && item.estoqueAtual < 500) return false;
    return true;
  }

  statusEstoqueTexto(item: IngredienteResponse): string {
    if (!item.estoqueAtual || item.estoqueAtual <= 0) return 'Out of Stock';
    if (!this.estoqueNormal(item)) return 'Restock';
    return 'In Stock';
  }

  statusEstoqueClasse(item: IngredienteResponse): string {
    const st = this.statusEstoqueTexto(item);
    if (st === 'Out of Stock') return 'red';
    if (st === 'Restock') return 'yellow';
    return 'purple';
  }

  private extrairErro(err: any): string {
    if (err?.error?.errors) {
      return Object.values(err.error.errors).join(' | ');
    }
    return err?.error?.detail || err?.error?.message || 'Erro ao comunicar com a API.';
  }
}
