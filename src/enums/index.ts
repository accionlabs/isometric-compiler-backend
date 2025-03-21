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