import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IngredienteRequest,
  IngredienteResponse,
  PageResponse,
} from '../models/api.models';

@Injectable({
  providedIn: 'root',
})
export class IngredienteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/ingredientes';

  listar(page = 0, size = 200): Observable<PageResponse<IngredienteResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'nome,asc');
    return this.http.get<PageResponse<IngredienteResponse>>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<IngredienteResponse> {
    return this.http.get<IngredienteResponse>(`${this.apiUrl}/${id}`);
  }

  criar(dto: IngredienteRequest): Observable<IngredienteResponse> {
    return this.http.post<IngredienteResponse>(this.apiUrl, dto);
  }

  atualizar(id: number, dto: IngredienteRequest): Observable<IngredienteResponse> {
    return this.http.put<IngredienteResponse>(`${this.apiUrl}/${id}`, dto);
  }

  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
