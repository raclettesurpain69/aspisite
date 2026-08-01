export type DiagnosticStatus = "ok" | "warning" | "error";

export interface DiagnosticCheck {
  id: string;
  label: string;
  status: DiagnosticStatus;
  message: string;
  /** Detail technique (message d'erreur brut, liste de problemes...) affiche en repli. */
  details?: string;
}
