import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  FichaTecnicaResponse,
  ItemFichaTecnicaRequest,
  ItemFichaTecnicaResponse,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class FichaTecnicaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:8080/api/produtos';

  listarPorProduto(produtoId: number): Observable<FichaTecnicaResponse> {
    return this.http.get<FichaTecnicaResponse>(`${this.baseUrl}/${produtoId}/itens`);
  }

  adicionar(
    produtoId: number,
    dto: ItemFichaTecnicaRequest
  ): Observable<ItemFichaTecnicaResponse> {
    return this.http.post<ItemFichaTecnicaResponse>(
      `${this.baseUrl}/${produtoId}/itens`,
      dto
    );
  }

  atualizarQuantidade(
    produtoId: number,
    itemId: number,
    dto: ItemFichaTecnicaRequest
  ): Observable<ItemFichaTecnicaResponse> {
    return this.http.put<ItemFichaTecnicaResponse>(
      `${this.baseUrl}/${produtoId}/itens/${itemId}`,
      dto
    );
  }

  deletar(produtoId: number, itemId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${produtoId}/itens/${itemId}`);
  }
}
