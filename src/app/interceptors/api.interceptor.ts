import {
  HttpErrorResponse,
  HttpHeaders,
  HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import {
  CategoriaProduto,
  FichaTecnicaResponse,
  IngredienteRequest,
  IngredienteResponse,
  ItemFichaTecnicaRequest,
  ItemFichaTecnicaResponse,
  ProdutoRequest,
  ProdutoResponse,
  UnidadeMedida,
} from '../models/api.models';

const DEMO_STORAGE_KEY = 'labolaria_demo_db_v1';

interface DemoItemRecord {
  id: number;
  produtoId: number;
  ingredienteId: number;
  quantidade: number;
}

interface DemoDatabase {
  nextIngredienteId: number;
  nextProdutoId: number;
  nextItemId: number;
  ingredientes: IngredienteResponse[];
  produtos: Omit<ProdutoResponse, 'custoTotalReceita'>[];
  itens: DemoItemRecord[];
}

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const modo = auth.modo();

  // 1. MODO PRODUÇÃO (REAL): anexa a chave secreta da confeitaria no cabeçalho X-Access-Key
  if (modo === 'REAL') {
    const key = auth.obterAccessKey();
    const cloned = req.clone({
      headers: req.headers.set('X-Access-Key', key),
    });
    return next(cloned);
  }

  // 2. MODO DEMONSTRAÇÃO (PORTFÓLIO / RECRUTADOR): responde localmente com receitas fictícias
  if (modo === 'DEMO' && req.url.includes('/api/')) {
    return handleDemoRequest(req.method, req.url, req.body);
  }

  return next(req);
};

function handleDemoRequest(
  method: string,
  url: string,
  body: any
): Observable<HttpResponse<any>> {
  const db = carregarBancoDemo();
  const path = extrairPathApi(url);

  // ==================== ROTAS DE FICHA TÉCNICA (/produtos/:id/itens) ====================
  const matchItensLista = path.match(/^\/produtos\/(\d+)\/itens$/);
  if (matchItensLista) {
    const produtoId = Number(matchItensLista[1]);
    const prod = db.produtos.find((p) => p.id === produtoId);
    if (!prod) {
      return erroDemo(404, 'Produto não encontrado no ambiente de demonstração.');
    }

    if (method === 'GET') {
      const ficha = montarFichaTecnica(db, produtoId);
      return okDemo(ficha);
    }

    if (method === 'POST') {
      const payload = body as ItemFichaTecnicaRequest;
      const ing = db.ingredientes.find((i) => i.id === Number(payload.ingredienteId));
      if (!ing) {
        return erroDemo(404, 'Ingrediente não encontrado.');
      }
      const duplicado = db.itens.some(
        (it) => it.produtoId === produtoId && it.ingredienteId === ing.id
      );
      if (duplicado) {
        return erroDemo(400, 'Este ingrediente já faz parte da ficha técnica deste produto.');
      }

      const novoItem: DemoItemRecord = {
        id: db.nextItemId++,
        produtoId,
        ingredienteId: ing.id,
        quantidade: Number(payload.quantidade),
      };
      db.itens.push(novoItem);
      salvarBancoDemo(db);

      const resp: ItemFichaTecnicaResponse = {
        id: novoItem.id,
        ingredienteId: ing.id,
        nomeIngrediente: ing.name,
        unidadeMedida: ing.unidadeMedida,
        quantidade: novoItem.quantidade,
        custoSubtotal: Number((novoItem.quantidade * ing.custoUnitarioBase).toFixed(4)),
      };
      return okDemo(resp, 201);
    }
  }

  const matchItemUnico = path.match(/^\/produtos\/(\d+)\/itens\/(\d+)$/);
  if (matchItemUnico) {
    const produtoId = Number(matchItemUnico[1]);
    const itemId = Number(matchItemUnico[2]);
    const idx = db.itens.findIndex(
      (it) => it.id === itemId && it.produtoId === produtoId
    );
    if (idx === -1) {
      return erroDemo(404, 'Item da ficha técnica não encontrado.');
    }

    if (method === 'PUT') {
      const payload = body as ItemFichaTecnicaRequest;
      db.itens[idx].quantidade = Number(payload.quantidade);
      salvarBancoDemo(db);

      const ing = db.ingredientes.find((i) => i.id === db.itens[idx].ingredienteId)!;
      const resp: ItemFichaTecnicaResponse = {
        id: db.itens[idx].id,
        ingredienteId: ing.id,
        nomeIngrediente: ing.name,
        unidadeMedida: ing.unidadeMedida,
        quantidade: db.itens[idx].quantidade,
        custoSubtotal: Number((db.itens[idx].quantidade * ing.custoUnitarioBase).toFixed(4)),
      };
      return okDemo(resp);
    }

    if (method === 'DELETE') {
      db.itens.splice(idx, 1);
      salvarBancoDemo(db);
      return okDemo(null, 204);
    }
  }

  // ==================== ROTAS DE PRODUTOS (/produtos) ====================
  if (path === '/produtos') {
    if (method === 'GET') {
      const lista: ProdutoResponse[] = db.produtos
        .map((p) => ({
          ...p,
          custoTotalReceita: calcularCustoProduto(db, p.id),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return okDemo({
        content: lista,
        totalElements: lista.length,
        totalPages: 1,
        size: 200,
        number: 0,
      });
    }

    if (method === 'POST') {
      const payload = body as ProdutoRequest;
      const novo = {
        id: db.nextProdutoId++,
        name: payload.name,
        categoriaProduto: payload.categoriaProduto,
        precoVenda: Number(payload.precoVenda),
        redimentoFatias: Number(payload.redimentoFatias),
      };
      db.produtos.push(novo);
      salvarBancoDemo(db);
      return okDemo({ ...novo, custoTotalReceita: 0 }, 201);
    }
  }

  const matchProdutoUnico = path.match(/^\/produtos\/(\d+)$/);
  if (matchProdutoUnico) {
    const id = Number(matchProdutoUnico[1]);
    const idx = db.produtos.findIndex((p) => p.id === id);
    if (idx === -1) {
      return erroDemo(404, 'Produto não encontrado.');
    }

    if (method === 'GET') {
      const p = db.produtos[idx];
      return okDemo({
        ...p,
        custoTotalReceita: calcularCustoProduto(db, p.id),
      });
    }

    if (method === 'PUT') {
      const payload = body as ProdutoRequest;
      db.produtos[idx] = {
        ...db.produtos[idx],
        name: payload.name,
        categoriaProduto: payload.categoriaProduto,
        precoVenda: Number(payload.precoVenda),
        redimentoFatias: Number(payload.redimentoFatias),
      };
      salvarBancoDemo(db);
      return okDemo({
        ...db.produtos[idx],
        custoTotalReceita: calcularCustoProduto(db, id),
      });
    }

    if (method === 'DELETE') {
      db.itens = db.itens.filter((it) => it.produtoId !== id);
      db.produtos.splice(idx, 1);
      salvarBancoDemo(db);
      return okDemo(null, 204);
    }
  }

  // ==================== ROTAS DE INGREDIENTES (/ingredientes) ====================
  if (path === '/ingredientes') {
    if (method === 'GET') {
      const lista = [...db.ingredientes].sort((a, b) => a.name.localeCompare(b.name));
      return okDemo({
        content: lista,
        totalElements: lista.length,
        totalPages: 1,
        size: 200,
        number: 0,
      });
    }

    if (method === 'POST') {
      const payload = body as IngredienteRequest;
      const novo: IngredienteResponse = {
        id: db.nextIngredienteId++,
        name: payload.name,
        unidadeMedida: payload.unidadeMedida,
        custoUnitarioBase: Number(payload.custoUnitarioBase),
        estoqueAtual: Number(payload.estoqueAtual),
      };
      db.ingredientes.push(novo);
      salvarBancoDemo(db);
      return okDemo(novo, 201);
    }
  }

  const matchIngredienteUnico = path.match(/^\/ingredientes\/(\d+)$/);
  if (matchIngredienteUnico) {
    const id = Number(matchIngredienteUnico[1]);
    const idx = db.ingredientes.findIndex((i) => i.id === id);
    if (idx === -1) {
      return erroDemo(404, 'Ingrediente não encontrado.');
    }

    if (method === 'GET') {
      return okDemo(db.ingredientes[idx]);
    }

    if (method === 'PUT') {
      const payload = body as IngredienteRequest;
      db.ingredientes[idx] = {
        ...db.ingredientes[idx],
        name: payload.name,
        unidadeMedida: payload.unidadeMedida,
        custoUnitarioBase: Number(payload.custoUnitarioBase),
        estoqueAtual: Number(payload.estoqueAtual),
      };
      salvarBancoDemo(db);
      return okDemo(db.ingredientes[idx]);
    }

    if (method === 'DELETE') {
      const emUso = db.itens.some((it) => it.ingredienteId === id);
      if (emUso) {
        return erroDemo(
          400,
          'Não é possível excluir um insumo que está vinculado a uma ficha técnica.'
        );
      }
      db.ingredientes.splice(idx, 1);
      salvarBancoDemo(db);
      return okDemo(null, 204);
    }
  }

  return okDemo({});
}

function extrairPathApi(url: string): string {
  const semQuery = url.split('?')[0];
  const idx = semQuery.indexOf('/api/');
  return idx !== -1 ? semQuery.substring(idx + 4) : semQuery;
}

function okDemo(body: any, status = 200): Observable<HttpResponse<any>> {
  return of(
    new HttpResponse({
      status,
      body,
      headers: new HttpHeaders({ 'X-Demo-Mode': 'true' }),
    })
  );
}

function erroDemo(status: number, detail: string): Observable<never> {
  return throwError(
    () =>
      new HttpErrorResponse({
        status,
        error: { detail, message: detail },
      })
  );
}

function montarFichaTecnica(db: DemoDatabase, produtoId: number): FichaTecnicaResponse {
  const prod = db.produtos.find((p) => p.id === produtoId)!;
  const itensDoProduto = db.itens.filter((it) => it.produtoId === produtoId);

  const itensDetalhados: ItemFichaTecnicaResponse[] = itensDoProduto
    .map((it) => {
      const ing = db.ingredientes.find((i) => i.id === it.ingredienteId);
      if (!ing) return null;
      const subtotal = Number((it.quantidade * ing.custoUnitarioBase).toFixed(4));
      return {
        id: it.id,
        ingredienteId: ing.id,
        nomeIngrediente: ing.name,
        unidadeMedida: ing.unidadeMedida,
        quantidade: it.quantidade,
        custoSubtotal: subtotal,
      };
    })
    .filter((x): x is ItemFichaTecnicaResponse => x !== null);

  const custoTotal = Number(
    itensDetalhados.reduce((acc, cur) => acc + cur.custoSubtotal, 0).toFixed(2)
  );

  return {
    produtoId: prod.id,
    nomeProduto: prod.name,
    itens: itensDetalhados,
    custoTotal,
  };
}

function calcularCustoProduto(db: DemoDatabase, produtoId: number): number {
  return montarFichaTecnica(db, produtoId).custoTotal;
}

function carregarBancoDemo(): DemoDatabase {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as DemoDatabase;
      } catch {
        // fallback para seed inicial
      }
    }
  }
  const inicial = criarBancoDemoInicial();
  salvarBancoDemo(inicial);
  return inicial;
}

function salvarBancoDemo(db: DemoDatabase): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(db));
  }
}

function criarBancoDemoInicial(): DemoDatabase {
  const ingredientes: IngredienteResponse[] = [
    { id: 1, name: 'Ovo Caipira Selecionado (Demo)', unidadeMedida: 'UNIDADE', custoUnitarioBase: 0.9, estoqueAtual: 240 },
    { id: 2, name: 'Farinha de Trigo Tipo 1 (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.006, estoqueAtual: 25000 },
    { id: 3, name: 'Açúcar Cristal Refinado (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.005, estoqueAtual: 20000 },
    { id: 4, name: 'Leite Integral Pasteurizado (Demo)', unidadeMedida: 'MILILITRO', custoUnitarioBase: 0.006, estoqueAtual: 15000 },
    { id: 5, name: 'Manteiga Extra sem Sal (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.042, estoqueAtual: 5000 },
    { id: 6, name: 'Cacau em Pó 50% Alcalino (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.049, estoqueAtual: 8000 },
    { id: 7, name: 'Leite Condensado Integral (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.019, estoqueAtual: 12000 },
    { id: 8, name: 'Creme de Leite 20% Gordura (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.016, estoqueAtual: 10000 },
    { id: 9, name: 'Cenoura Fresca Ralada (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.007, estoqueAtual: 6000 },
    { id: 10, name: 'Fermento Químico em Pó (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.035, estoqueAtual: 2000 },
    { id: 11, name: 'Creme de Avelã Importado (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.068, estoqueAtual: 4000 },
    { id: 12, name: 'Morango Fresco Bandeja (Demo)', unidadeMedida: 'UNIDADE', custoUnitarioBase: 0.6, estoqueAtual: 150 },
    { id: 13, name: 'Fubá Mimoso de Moinho (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.0055, estoqueAtual: 10000 },
    { id: 14, name: 'Doce de Leite Artesanal (Demo)', unidadeMedida: 'GRAMA', custoUnitarioBase: 0.029, estoqueAtual: 6000 },
  ];

  const produtos: Omit<ProdutoResponse, 'custoTotalReceita'>[] = [
    { id: 1, name: 'Bolo Clássico de Baunilha (Demo)', categoriaProduto: 'CASEIRO_TRADICIONAL', precoVenda: 32, redimentoFatias: 12 },
    { id: 2, name: 'Bolo de Cenoura Tradicional (Demo)', categoriaProduto: 'CASEIRO_TRADICIONAL', precoVenda: 34, redimentoFatias: 12 },
    { id: 3, name: 'Broa Cremosa de Fubá (Demo)', categoriaProduto: 'CASEIRO_TRADICIONAL', precoVenda: 30, redimentoFatias: 12 },
    { id: 4, name: 'Vulcão de Brigadeiro Belga (Demo)', categoriaProduto: 'VULCAO', precoVenda: 58, redimentoFatias: 10 },
    { id: 5, name: 'Piscininha de Cenoura c/ Avelã (Demo)', categoriaProduto: 'VULCAO', precoVenda: 52, redimentoFatias: 8 },
    { id: 6, name: 'Vulcão Churros c/ Doce de Leite (Demo)', categoriaProduto: 'VULCAO', precoVenda: 54, redimentoFatias: 10 },
    { id: 7, name: 'Torta Festa Morango & Chocolate (Demo)', categoriaProduto: 'RECHEADO_FESTA', precoVenda: 88, redimentoFatias: 10 },
    { id: 8, name: 'Torta Suprema de Avelã (Demo)', categoriaProduto: 'RECHEADO_FESTA', precoVenda: 96, redimentoFatias: 10 },
    { id: 9, name: 'Bolo no Pote Sensação de Morango (Demo)', categoriaProduto: 'POTE', precoVenda: 15, redimentoFatias: 1 },
    { id: 10, name: 'Bolo no Pote Duplo Brigadeiro (Demo)', categoriaProduto: 'POTE', precoVenda: 16, redimentoFatias: 1 },
  ];

  let itemId = 1;
  const addItens = (produtoId: number, pares: [number, number][]): DemoItemRecord[] =>
    pares.map(([ingredienteId, quantidade]) => ({
      id: itemId++,
      produtoId,
      ingredienteId,
      quantidade,
    }));

  const itens: DemoItemRecord[] = [
    ...addItens(1, [[1, 3], [2, 300], [3, 200], [4, 200], [5, 90], [10, 15]]),
    ...addItens(2, [[1, 3], [9, 240], [2, 260], [3, 200], [5, 80], [10, 15]]),
    ...addItens(3, [[1, 3], [13, 250], [2, 100], [3, 180], [4, 250], [5, 60], [10, 15]]),
    ...addItens(4, [[1, 3], [2, 260], [3, 180], [6, 80], [7, 395], [8, 200], [10, 15]]),
    ...addItens(5, [[1, 2], [9, 180], [2, 200], [3, 150], [11, 140], [8, 150], [10, 10]]),
    ...addItens(6, [[1, 3], [2, 260], [3, 180], [4, 180], [14, 350], [8, 150], [10, 15]]),
    ...addItens(7, [[1, 4], [2, 300], [3, 200], [6, 90], [7, 395], [8, 300], [12, 12], [10, 15]]),
    ...addItens(8, [[1, 4], [2, 280], [6, 100], [11, 220], [7, 395], [8, 300], [10, 15]]),
    ...addItens(9, [[2, 60], [6, 20], [7, 80], [8, 50], [12, 3]]),
    ...addItens(10, [[2, 60], [6, 25], [7, 75], [11, 35], [8, 40]]),
  ];

  return {
    nextIngredienteId: 15,
    nextProdutoId: 11,
    nextItemId: itemId,
    ingredientes,
    produtos,
    itens,
  };
}
