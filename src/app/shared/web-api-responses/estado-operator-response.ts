import { EstadoOperatorResponseStatuses } from './estado-operator-response-statuses.enum';
import { EstadoOperadorRespuesta } from './estado-operator-respuesta';

export interface EstadoOperatorResponse {

  estadoOperador: EstadoOperadorRespuesta;
  status: EstadoOperatorResponseStatuses;
  message: string;
}
