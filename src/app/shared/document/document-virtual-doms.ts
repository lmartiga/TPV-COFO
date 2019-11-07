export interface DocumentVirtualDoms {
  idSurtidor: number;
  idTransaccion: number;
  mode: number;
  lockingposid: number;
  documentCuerpo: string;
  emissionDate?: Date;
}
