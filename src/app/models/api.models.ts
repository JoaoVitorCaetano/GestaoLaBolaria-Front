export type UnidadeMedida = 'GRAMA' | 'MILILITRO' | 'UNIDADE';

export type CategoriaProduto =
  | 'CASEIRO_TRADICIONAL'
  | 'VULCAO'
  | 'RECHEADO_FESTA'
  | 'POTE';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface IngredienteRequest {
  name: string;
  unidadeMedida: UnidadeMedida;
  custoUnitarioBase: number;
  estoqueAtual: number;
}

export interface IngredienteResponse {
  id: number;
  name: string;
  unidadeMedida: UnidadeMedida;
  custoUnitarioBase: number;
  estoqueAtual: number;
}

export interface ProdutoRequest {
  name: string;
  categoriaProduto: CategoriaProduto;
  precoVenda: number;
  redimentoFatias: number;
}

export interface ProdutoResponse {
  id: number;
  name: string;
  categoriaProduto: CategoriaProduto;
  precoVenda: number;
  redimentoFatias: number;
  custoTotalReceita: number;
}

export interface ItemFichaTecnicaRequest {
  ingredienteId: number;
  quantidade: number;
}

export interface ItemFichaTecnicaResponse {
  id: number;
  ingredienteId: number;
  nomeIngrediente: string;
  unidadeMedida: UnidadeMedida;
  quantidade: number;
  custoSubtotal: number;
}

export interface FichaTecnicaResponse {
  produtoId: number;
  nomeProduto: string;
  itens: ItemFichaTecnicaResponse[];
  custoTotal: number;
}
