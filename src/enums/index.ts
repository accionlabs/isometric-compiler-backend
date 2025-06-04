export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum LLM_PLATFORM {
  OPENAI = "OPENAI",
  OPENAI_MATURE = "OPENAI_MATURE",
  HUGGINGFACE = "HF",
  GOOGLEAI = "GEMINI",
  AWSBEDROCK = 'AWSBEDROCK'
};

export enum SemanticModelStatus {
  ACTIVE = Status.ACTIVE,
  INITIATED = 'initiated',
  GENERATING_BUSINESS_SPEC = 'generating_business_spec',
  GENERATING_QUM_DESIGN_SPEC = 'generating_qum_desing_spec',
  GENERATING_BREEZE_SPEC = 'generating_breeze_spec',
  INACTIVE = Status.INACTIVE
}

export enum MessageTypes {
  FILE = 'file',
  TEXT = 'text',
  JSON = 'json'
}

export enum MessageRoles {
  SYSTEM = 'system',
  USER = 'user'
}

export enum Agents {
  REQUIREMENT_AGENT = 'requirement_agent',
  DESIGN_AGENT = 'design_agent',
  ARCHITECTURE_AGENT = 'architecture_agent',
  BREEZE_AGENT = 'breeze_agent',
  ATDD_AGENT = 'atdd_agent',
  CODE_GENERATION_AGENT = 'code_generation_agent',
}

export enum UnifiedModelGenerationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PROCESSING = 'processing',
  ERROR = 'error',
}

export enum SemancticModelType {
  ARCHITECTURAL = 'architectural_specs',
  QUM = 'qum_specs',
}