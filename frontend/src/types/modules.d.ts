// Module declarations for missing dependencies
declare module 'pg' {
  export interface Client {
    connect(): Promise<void>
    query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount?: number }>
    end(): Promise<void>
  }
  export class Client {
    constructor(config: { connectionString: string })
  }
}

declare module 'cassandra-driver' {
  export class Client {
    constructor(config: any)
    execute(query: string, params?: any[]): Promise<{ rows: any[] }>
    shutdown(): Promise<void>
  }
}

declare module 'uuid' {
  export function v4(): string
  export function v1(): string
}