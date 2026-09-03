type WebMcpToolExecutionOptions = {
  signal?: AbortSignal;
};

type WebMcpRegisterToolOptions = {
  signal?: AbortSignal;
  exposedTo?: string[];
};

type WebMcpToolDefinition<TInput = unknown, TOutput = unknown> = {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: TInput, options?: WebMcpToolExecutionOptions) => TOutput | Promise<TOutput>;
};

type WebMcpModelContext = {
  registerTool: <TInput = unknown, TOutput = unknown>(
    tool: WebMcpToolDefinition<TInput, TOutput>,
    options?: WebMcpRegisterToolOptions,
  ) => Promise<unknown>;
};

declare global {
  interface Window {
    __hacklistWebMcpRegistrar?: {
      mounted: boolean;
      registered: boolean;
    };
  }

  interface Document {
    modelContext?: WebMcpModelContext;
  }
}

export {};
