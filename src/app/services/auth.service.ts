import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export type ModoAcesso = 'REAL' | 'DEMO' | null;

const STORAGE_MODO_KEY = 'labolaria_modo_acesso';
const STORAGE_ACCESS_KEY = 'labolaria_access_key';
const DEMO_STORAGE_KEY = 'labolaria_demo_db_v1';

// Hash SHA-256 da senha da confeitaria (nunca expõe a senha em texto puro no código do GitHub)
const EXPECTED_SHA256 = 'ac3d3b406457644a5a80ea64b6d76760ab37944635397e894d493b045fb72c4a';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);

  readonly modo = signal<ModoAcesso>(this.lerModoInicial());

  readonly autenticado = computed(() => this.modo() !== null);
  readonly isDemo = computed(() => this.modo() === 'DEMO');
  readonly isReal = computed(() => this.modo() === 'REAL');

  private lerModoInicial(): ModoAcesso {
    if (typeof window === 'undefined') return null;
    const salvo = sessionStorage.getItem(STORAGE_MODO_KEY);
    if (salvo === 'REAL' || salvo === 'DEMO') {
      return salvo;
    }
    return null;
  }

  obterAccessKey(): string {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(STORAGE_ACCESS_KEY) || '';
  }

  async loginConfeitaria(senha: string): Promise<boolean> {
    const limpa = (senha || '').trim();
    if (!limpa) return false;

    const hash = await this.sha256Hex(limpa);
    if (hash === EXPECTED_SHA256) {
      sessionStorage.setItem(STORAGE_MODO_KEY, 'REAL');
      sessionStorage.setItem(STORAGE_ACCESS_KEY, limpa);
      this.modo.set('REAL');
      return true;
    }

    return false;
  }

  entrarModoDemo(): void {
    sessionStorage.setItem(STORAGE_MODO_KEY, 'DEMO');
    sessionStorage.removeItem(STORAGE_ACCESS_KEY);
    this.modo.set('DEMO');
    this.router.navigate(['/produtos']);
  }

  resetarDadosDemo(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_STORAGE_KEY);
      window.location.reload();
    }
  }

  sair(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_MODO_KEY);
      sessionStorage.removeItem(STORAGE_ACCESS_KEY);
    }
    this.modo.set(null);
    this.router.navigate(['/login']);
  }

  private async sha256Hex(texto: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
