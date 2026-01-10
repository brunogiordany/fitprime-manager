/**
 * AI Assistant Engine - Atendimento Super Humanizado
 * 
 * Este módulo implementa uma IA de atendimento altamente inteligente e humanizada
 * para personal trainers, capaz de atender leads (conversão) e alunos (suporte).
 */

import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// ==================== HELPERS ====================

// Função para fazer parse seguro de JSON
function safeJsonParse<T>(value: string, defaultValue: T): T {
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
}

// ==================== TIPOS ====================

interface AiConfig {
  assistantName: string;
  assistantGender: "male" | "female" | "neutral";
  communicationTone: "formal" | "casual" | "motivational" | "friendly";
  useEmojis: boolean;
  emojiFrequency: "low" | "medium" | "high";
  customPersonality?: string;
  personalBio?: string;
  servicesOffered?: string[];
  workingHoursDescription?: string;
  locationDescription?: string;
  priceRange?: string;
  welcomeMessageLead?: string;
  welcomeMessageStudent?: string;
  awayMessage?: string;
  escalateOnKeywords?: string[];
  escalateAfterMessages: number;
  escalateOnSentiment: boolean;
  canScheduleEvaluation: boolean;
  canScheduleSession: boolean;
  canAnswerWorkoutQuestions: boolean;
  canAnswerDietQuestions: boolean;
  canSendMotivation: boolean;
  canHandlePayments: boolean;
  isEnabled: boolean;
  enabledForLeads: boolean;
  enabledForStudents: boolean;
  // Auto-reply settings
  autoReplyEnabled: boolean;
  autoReplyStartHour: number;
  autoReplyEndHour: number;
  autoReplyWeekends: boolean;
  minResponseDelay: number;
  maxResponseDelay: number;
}

interface StudentContext {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  status: string;
  // Anamnese
  mainGoal?: string;
  secondaryGoals?: string;
  exerciseExperience?: string;
  medicalHistory?: string;
  injuries?: string;
  // Medidas recentes
  latestMeasurement?: {
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
    measureDate?: string;
  };
  // Treino atual
  currentWorkout?: {
    name: string;
    goal?: string;
    frequency?: number;
  };
  // Sessões
  upcomingSessions?: Array<{
    date: string;
    time: string;
    type?: string;
  }>;
  lastSession?: {
    date: string;
    attendance?: string;
  };
  // Pagamentos
  pendingCharges?: number;
  // Progresso
  progressSummary?: string;
  // Memórias da IA
  memories?: Array<{
    type: string;
    key: string;
    value: string;
  }>;
}

interface LeadContext {
  id: number;
  name?: string;
  phone: string;
  email?: string;
  mainGoal?: string;
  currentActivity?: string;
  availability?: string;
  budget?: string;
  urgency: string;
  temperature: string;
  status: string;
  evaluationScheduledAt?: Date;
  memories?: Array<{
    type: string;
    key: string;
    value: string;
  }>;
}

interface PersonalContext {
  id: number;
  name: string;
  businessName?: string;
  cref?: string;
  bio?: string;
  specialties?: string[];
  whatsappNumber?: string;
}

interface ConversationHistory {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AiResponse {
  message: string;
  intent?: string;
  sentiment?: "positive" | "neutral" | "negative";
  urgency?: "low" | "medium" | "high";
  shouldEscalate: boolean;
  escalationReason?: string;
  actions?: string[];
  memoriesToSave?: Array<{
    type: string;
    key: string;
    value: string;
    importance: string;
  }>;
}

// ==================== PROMPTS ====================

function buildSystemPrompt(
  config: AiConfig,
  personal: PersonalContext,
  mode: "lead" | "student",
  context: StudentContext | LeadContext | null
): string {
  const genderPronoun = config.assistantGender === "male" ? "ele" : config.assistantGender === "female" ? "ela" : "elu";
  const genderArticle = config.assistantGender === "male" ? "o" : config.assistantGender === "female" ? "a" : "e";
  
  const emojiInstruction = config.useEmojis 
    ? config.emojiFrequency === "high" 
      ? "Use emojis com frequência para tornar a conversa mais leve e amigável (2-3 por mensagem)."
      : config.emojiFrequency === "medium"
        ? "Use emojis com moderação para dar personalidade (1-2 por mensagem, quando apropriado)."
        : "Use emojis raramente, apenas em momentos especiais de celebração ou empatia."
    : "NÃO use emojis nas mensagens.";

  const toneInstruction = {
    formal: "Mantenha um tom profissional e respeitoso, usando 'você' e evitando gírias.",
    casual: "Seja descontraído e amigável, como um amigo que entende de fitness. Use linguagem do dia-a-dia.",
    motivational: "Seja energético e motivador! Inspire a pessoa a alcançar seus objetivos. Use frases de incentivo.",
    friendly: "Seja caloroso e acolhedor, como um profissional que genuinamente se importa com o bem-estar da pessoa."
  }[config.communicationTone];

  let basePrompt = `Você é ${config.assistantName}, ${genderArticle} assistente virtual d${genderArticle} ${personal.name}${personal.businessName ? ` (${personal.businessName})` : ""}, um${genderArticle} personal trainer${personal.cref ? ` com CREF ${personal.cref}` : ""}.

## SUA PERSONALIDADE
${toneInstruction}
${emojiInstruction}
${config.customPersonality ? `\nInstruções adicionais de personalidade: ${config.customPersonality}` : ""}

## REGRAS DE OURO (NUNCA QUEBRE ESTAS REGRAS)
1. NUNCA diga que é uma IA, robô ou assistente virtual. Você é ${config.assistantName}, parte da equipe do ${personal.name}.
2. NUNCA use frases robóticas como "Como posso ajudá-lo?" ou "Estou aqui para ajudar". Seja natural!
3. NUNCA responda de forma genérica. Sempre personalize baseado no contexto da pessoa.
4. NUNCA invente informações. Se não souber algo, diga que vai verificar com ${personal.name}.
5. SEMPRE mantenha a conversa fluida e natural, como uma pessoa real faria.
6. SEMPRE demonstre empatia genuína e interesse pela pessoa.
7. SEMPRE lembre de detalhes mencionados anteriormente na conversa.
8. Responda de forma CONCISA - mensagens curtas e diretas, como no WhatsApp real.
9. Use quebras de linha para separar ideias, não parágrafos longos.
10. Varie suas respostas - nunca use a mesma frase de abertura duas vezes seguidas.

## SOBRE ${personal.name.toUpperCase()}
${personal.bio || "Personal trainer dedicado a ajudar pessoas a alcançarem seus objetivos de saúde e fitness."}
${config.servicesOffered ? `\nServiços oferecidos: ${config.servicesOffered.join(", ")}` : ""}
${config.workingHoursDescription ? `\nHorários: ${config.workingHoursDescription}` : ""}
${config.locationDescription ? `\nLocal de atendimento: ${config.locationDescription}` : ""}
${config.priceRange ? `\nFaixa de preço: ${config.priceRange}` : ""}
`;

  if (mode === "lead") {
    const lead = context as LeadContext | null;
    basePrompt += `
## SEU OBJETIVO (MODO LEAD - CONVERSÃO)
Você está conversando com um POTENCIAL CLIENTE. Seu objetivo é:
1. Criar rapport e conexão genuína
2. Entender as necessidades, objetivos e dores da pessoa
3. Apresentar os serviços do ${personal.name} de forma natural (não forçada)
4. Qualificar o lead (entender se é um bom fit)
5. Conduzir para o agendamento de uma avaliação gratuita

${lead ? `
## INFORMAÇÕES DO LEAD
Nome: ${lead.name || "Ainda não informado"}
Objetivo principal: ${lead.mainGoal || "Ainda não informado"}
Atividade atual: ${lead.currentActivity || "Ainda não informado"}
Disponibilidade: ${lead.availability || "Ainda não informado"}
Orçamento: ${lead.budget || "Ainda não informado"}
Status: ${lead.status}
${lead.evaluationScheduledAt ? `Avaliação agendada para: ${new Date(lead.evaluationScheduledAt).toLocaleString("pt-BR")}` : ""}
${lead.memories && lead.memories.length > 0 ? `
## MEMÓRIAS IMPORTANTES
${lead.memories.map(m => `- ${m.key}: ${m.value}`).join("\n")}
` : ""}
` : ""}

## ESTRATÉGIA DE CONVERSÃO
- Faça perguntas abertas para entender a situação da pessoa
- Identifique a DOR principal (o que incomoda, o que quer mudar)
- Mostre que entende e que ${personal.name} pode ajudar
- Não seja agressivo em vendas - seja consultivo
- Quando sentir que a pessoa está interessada, sugira naturalmente a avaliação
${config.canScheduleEvaluation ? "- Você pode agendar avaliações diretamente" : "- Para agendar avaliações, direcione para falar com " + personal.name}
`;
  } else {
    const student = context as StudentContext | null;
    basePrompt += `
## SEU OBJETIVO (MODO ALUNO - ATENDIMENTO)
Você está conversando com um ALUNO do ${personal.name}. Seu objetivo é:
1. Dar suporte de qualidade e personalizado
2. Responder dúvidas sobre treinos, exercícios e rotina
3. Motivar e manter o aluno engajado
4. Ajudar com agendamentos e reagendamentos
5. Escalar para ${personal.name} quando necessário

${student ? `
## INFORMAÇÕES DO ALUNO
Nome: ${student.name}
Status: ${student.status}
Objetivo principal: ${student.mainGoal || "Não definido"}
Experiência: ${student.exerciseExperience || "Não informada"}
${student.injuries ? `Lesões/Restrições: ${student.injuries}` : ""}
${student.medicalHistory ? `Histórico médico relevante: ${student.medicalHistory}` : ""}

${student.latestMeasurement ? `
## ÚLTIMAS MEDIDAS (${student.latestMeasurement.measureDate})
Peso: ${student.latestMeasurement.weight ? student.latestMeasurement.weight + "kg" : "Não informado"}
Gordura corporal: ${student.latestMeasurement.bodyFat ? student.latestMeasurement.bodyFat + "%" : "Não informado"}
Massa muscular: ${student.latestMeasurement.muscleMass ? student.latestMeasurement.muscleMass + "kg" : "Não informado"}
` : ""}

${student.currentWorkout ? `
## TREINO ATUAL
Nome: ${student.currentWorkout.name}
Objetivo: ${student.currentWorkout.goal || "Geral"}
Frequência: ${student.currentWorkout.frequency ? student.currentWorkout.frequency + "x por semana" : "Não definida"}
` : ""}

${student.upcomingSessions && student.upcomingSessions.length > 0 ? `
## PRÓXIMAS SESSÕES
${student.upcomingSessions.map(s => `- ${s.date} às ${s.time}${s.type ? ` (${s.type})` : ""}`).join("\n")}
` : ""}

${student.lastSession ? `
## ÚLTIMA SESSÃO
Data: ${student.lastSession.date}
Presença: ${student.lastSession.attendance || "Não registrada"}
` : ""}

${student.pendingCharges && student.pendingCharges > 0 ? `
## COBRANÇAS PENDENTES
${student.pendingCharges} cobrança(s) pendente(s)
` : ""}

${student.progressSummary ? `
## RESUMO DO PROGRESSO
${student.progressSummary}
` : ""}

${student.memories && student.memories.length > 0 ? `
## MEMÓRIAS IMPORTANTES
${student.memories.map(m => `- ${m.key}: ${m.value}`).join("\n")}
` : ""}
` : ""}

## O QUE VOCÊ PODE FAZER
${config.canAnswerWorkoutQuestions ? "✓ Responder dúvidas sobre treinos e exercícios" : "✗ Dúvidas sobre treinos - direcionar para " + personal.name}
${config.canAnswerDietQuestions ? "✓ Dar orientações gerais sobre alimentação (sem prescrever dietas)" : "✗ Dúvidas sobre dieta - direcionar para " + personal.name}
${config.canScheduleSession ? "✓ Ajudar com agendamento/reagendamento de sessões" : "✗ Agendamentos - direcionar para " + personal.name}
${config.canSendMotivation ? "✓ Enviar mensagens motivacionais personalizadas" : ""}
${config.canHandlePayments ? "✓ Falar sobre pagamentos e cobranças" : "✗ Assuntos financeiros - direcionar para " + personal.name}
`;
  }

  basePrompt += `
## QUANDO ESCALAR PARA ${personal.name.toUpperCase()}
Você DEVE indicar que precisa escalar a conversa quando:
- A pessoa expressar frustração, raiva ou insatisfação
- Houver reclamação sobre o serviço
- A pessoa pedir explicitamente para falar com ${personal.name}
- Assuntos que você não pode resolver (conforme listado acima)
- Emergências de saúde ou lesões
- Após ${config.escalateAfterMessages} mensagens sem resolução clara
${config.escalateOnKeywords && config.escalateOnKeywords.length > 0 ? `- Se a pessoa mencionar: ${config.escalateOnKeywords.join(", ")}` : ""}

Quando precisar escalar, diga algo como: "Vou passar essa informação para ${personal.name} e ele(a) vai entrar em contato com você em breve, tá?"

## FORMATO DE RESPOSTA
Responda APENAS com a mensagem que será enviada ao usuário.
Seja conciso e natural - como uma conversa real de WhatsApp.
NÃO inclua explicações, metadados ou formatação especial.
`;

  return basePrompt;
}

function buildAnalysisPrompt(message: string, conversationHistory: ConversationHistory[]): string {
  return `Analise a seguinte mensagem do usuário e retorne um JSON com:
- intent: a intenção principal (greeting, question_workout, question_diet, scheduling, complaint, payment, motivation, general, farewell)
- sentiment: o sentimento (positive, neutral, negative)
- urgency: a urgência (low, medium, high)
- shouldEscalate: boolean indicando se deve escalar para humano
- escalationReason: motivo da escalação (se aplicável)
- memoriesToSave: array de memórias importantes para salvar (type, key, value, importance)

Histórico recente:
${conversationHistory.slice(-5).map(h => `${h.role}: ${h.content}`).join("\n")}

Mensagem atual do usuário:
"${message}"

Responda APENAS com o JSON válido, sem explicações.`;
}

// ==================== FUNÇÕES PRINCIPAIS ====================

/**
 * Processa uma mensagem e gera resposta da IA
 */
export async function processMessage(params: {
  personalId: number;
  phone: string;
  message: string;
  messageType?: "text" | "audio" | "image" | "video" | "file";
  mediaUrl?: string;
  conversationId?: number;
}): Promise<AiResponse> {
  const { personalId, phone, message, messageType = "text" } = params;
  
  // 1. Buscar configuração da IA
  const config = await getAiConfig(personalId);
  if (!config || !config.isEnabled) {
    return {
      message: "",
      shouldEscalate: true,
      escalationReason: "AI disabled"
    };
  }
  
  // 2. Buscar contexto do personal
  const personal = await getPersonalByIdInternal(personalId);
  if (!personal) {
    throw new Error("Personal not found");
  }
  
  const personalContext: PersonalContext = {
    id: personal.id,
    name: personal.user?.name || "Personal",
    businessName: personal.businessName || undefined,
    cref: personal.cref || undefined,
    bio: personal.bio || undefined,
    specialties: personal.specialties ? JSON.parse(personal.specialties) : undefined,
    whatsappNumber: personal.whatsappNumber || undefined
  };
  
  // 3. Identificar se é lead ou aluno
  const normalizedPhone = normalizePhone(phone);
  const student = await db.getStudentByPhone(normalizedPhone);
  const lead = student ? null : await getOrCreateLead(personalId, normalizedPhone);
  
  const mode: "lead" | "student" = student ? "student" : "lead";
  const isEnabledForMode = mode === "lead" ? config.enabledForLeads : config.enabledForStudents;
  
  if (!isEnabledForMode) {
    return {
      message: "",
      shouldEscalate: true,
      escalationReason: `AI disabled for ${mode}s`
    };
  }
  
  // 4. Buscar ou criar conversa
  let conversation = await getOrCreateConversation(personalId, normalizedPhone, mode, student?.id, lead?.id);
  
  // 5. Buscar histórico de mensagens
  const history = await getConversationHistory(conversation.id);
  
  // 6. Buscar contexto completo
  let context: StudentContext | LeadContext | null = null;
  
  if (student) {
    context = await buildStudentContext(student.id, personalId);
  } else if (lead) {
    context = await buildLeadContext(lead.id, personalId);
  }
  
  // 7. Analisar a mensagem do usuário
  const analysis = await analyzeMessage(message, history);
  
  // 8. Verificar se deve escalar
  if (analysis.shouldEscalate || shouldEscalateBasedOnRules(config, analysis, history.length)) {
    // Salvar mensagem do usuário
    await saveMessage(conversation.id, "user", message, messageType, {
      detectedIntent: analysis.intent,
      detectedSentiment: analysis.sentiment,
      detectedUrgency: analysis.urgency
    });
    
    // Atualizar conversa para escalada
    await updateConversationStatus(conversation.id, "escalated", analysis.escalationReason || "Escalated by rules");
    
    return {
      message: config.awayMessage || `Vou passar sua mensagem para ${personalContext.name} e ele(a) vai te responder em breve! 🙏`,
      intent: analysis.intent,
      sentiment: analysis.sentiment,
      urgency: analysis.urgency,
      shouldEscalate: true,
      escalationReason: analysis.escalationReason || "Escalated by rules"
    };
  }
  
  // 9. Gerar resposta da IA
  const systemPrompt = buildSystemPrompt(config, personalContext, mode, context);
  
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.slice(-10).map(h => ({
      role: h.role === "user" ? "user" as const : "assistant" as const,
      content: h.content
    })),
    { role: "user" as const, content: message }
  ];
  
  const startTime = Date.now();
  const response = await invokeLLM({ messages });
  const latencyMs = Date.now() - startTime;
  
  const rawContent = response.choices[0]?.message?.content;
  const aiMessage: string = typeof rawContent === "string" ? rawContent : "Desculpe, não consegui processar sua mensagem. Vou pedir para o personal te responder!";
  
  // 10. Salvar mensagens
  await saveMessage(conversation.id, "user", message, messageType, {
    detectedIntent: analysis.intent,
    detectedSentiment: analysis.sentiment,
    detectedUrgency: analysis.urgency
  });
  
  await saveMessage(conversation.id, "ai", aiMessage, "text", {
    aiLatencyMs: latencyMs,
    aiPromptTokens: response.usage?.prompt_tokens,
    aiCompletionTokens: response.usage?.completion_tokens
  });
  
  // 11. Salvar memórias importantes
  if (analysis.memoriesToSave && analysis.memoriesToSave.length > 0) {
    for (const memory of analysis.memoriesToSave) {
      await saveMemory(personalId, student?.id, lead?.id, memory);
    }
  }
  
  // 12. Atualizar conversa
  await updateConversationStats(conversation.id);
  
  return {
    message: aiMessage,
    intent: analysis.intent,
    sentiment: analysis.sentiment,
    urgency: analysis.urgency,
    shouldEscalate: false,
    actions: analysis.actions,
    memoriesToSave: analysis.memoriesToSave
  };
}

/**
 * Gera mensagem de boas-vindas
 */
export async function generateWelcomeMessage(params: {
  personalId: number;
  phone: string;
  isNewLead: boolean;
}): Promise<string> {
  const { personalId, phone, isNewLead } = params;
  
  const config = await getAiConfig(personalId);
  if (!config) return "";
  
  if (isNewLead && config.welcomeMessageLead) {
    return config.welcomeMessageLead;
  }
  
  if (!isNewLead && config.welcomeMessageStudent) {
    return config.welcomeMessageStudent;
  }
  
  const personal = await getPersonalByIdInternal(personalId);
  const personalName = personal?.user?.name || "Personal";
  
  if (isNewLead) {
    return `Oi! 👋 Tudo bem?\n\nSou ${config.assistantName}, da equipe do ${personalName}.\n\nVi que você entrou em contato! Como posso te ajudar?`;
  } else {
    return `E aí! 💪\n\nTudo certo por aí?\n\nEm que posso te ajudar hoje?`;
  }
}

// ==================== FUNÇÕES AUXILIARES ====================

async function getAiConfig(personalId: number): Promise<AiConfig | null> {
  const config = await db.getAiAssistantConfig(personalId);
  if (!config) return null;
  
  return {
    assistantName: config.assistantName,
    assistantGender: config.assistantGender as any,
    communicationTone: config.communicationTone as any,
    useEmojis: config.useEmojis ?? true,
    emojiFrequency: config.emojiFrequency as any,
    customPersonality: config.customPersonality || undefined,
    personalBio: config.personalBio || undefined,
    servicesOffered: config.servicesOffered ? safeJsonParse(config.servicesOffered, [config.servicesOffered]) : undefined,
    workingHoursDescription: config.workingHoursDescription || undefined,
    locationDescription: config.locationDescription || undefined,
    priceRange: config.priceRange || undefined,
    welcomeMessageLead: config.welcomeMessageLead || undefined,
    welcomeMessageStudent: config.welcomeMessageStudent || undefined,
    awayMessage: config.awayMessage || undefined,
    escalateOnKeywords: config.escalateOnKeywords ? safeJsonParse(config.escalateOnKeywords, []) : undefined,
    escalateAfterMessages: config.escalateAfterMessages ?? 10,
    escalateOnSentiment: config.escalateOnSentiment ?? true,
    canScheduleEvaluation: config.canScheduleEvaluation ?? true,
    canScheduleSession: config.canScheduleSession ?? true,
    canAnswerWorkoutQuestions: config.canAnswerWorkoutQuestions ?? true,
    canAnswerDietQuestions: config.canAnswerDietQuestions ?? true,
    canSendMotivation: config.canSendMotivation ?? true,
    canHandlePayments: config.canHandlePayments ?? false,
    isEnabled: config.isEnabled ?? true,
    enabledForLeads: config.enabledForLeads ?? true,
    enabledForStudents: config.enabledForStudents ?? true,
    // Auto-reply settings
    autoReplyEnabled: config.autoReplyEnabled ?? true,
    autoReplyStartHour: config.autoReplyStartHour ?? 8,
    autoReplyEndHour: config.autoReplyEndHour ?? 22,
    autoReplyWeekends: config.autoReplyWeekends ?? true,
    minResponseDelay: config.minResponseDelay ?? 2,
    maxResponseDelay: config.maxResponseDelay ?? 8
  };
}

async function getOrCreateLead(personalId: number, phone: string): Promise<any> {
  let lead = await db.getLeadByPhone(personalId, phone);
  if (!lead) {
    const leadId = await db.createLead({
      personalId,
      phone,
      status: "new",
      source: "whatsapp"
    });
    lead = await db.getLeadById(leadId);
  }
  return lead;
}

async function getOrCreateConversation(
  personalId: number,
  phone: string,
  type: "lead" | "student",
  studentId?: number,
  leadId?: number
): Promise<any> {
  let conversation = await db.getActiveAiConversation(personalId, phone);
  if (!conversation) {
    const conversationId = await db.createAiConversation({
      personalId,
      conversationType: type,
      studentId,
      leadId,
      whatsappPhone: phone,
      status: "active"
    });
    conversation = await db.getAiConversationById(conversationId);
  }
  return conversation;
}

async function getConversationHistory(conversationId: number): Promise<ConversationHistory[]> {
  const messages = await db.getAiMessagesByConversation(conversationId, 20);
  return messages.map(m => ({
    role: m.sender === "user" ? "user" as const : "assistant" as const,
    content: m.message,
    timestamp: m.createdAt
  }));
}

async function buildStudentContext(studentId: number, personalId: number): Promise<StudentContext> {
  const student = await db.getStudentById(studentId, personalId);
  if (!student) throw new Error("Student not found");
  
  const anamnesis = await db.getAnamnesisByStudentId(studentId);
  const measurements = await db.getMeasurementsByStudentId(studentId);
  const latestMeasurement = measurements[0];
  const workouts = await db.getWorkoutsByStudentId(studentId);
  const currentWorkout = workouts.find(w => w.status === "active");
  const sessions = await db.getSessionsByStudentId(studentId);
  const upcomingSessions = sessions.filter(s => new Date(s.scheduledAt) > new Date() && s.status === "scheduled").slice(0, 3);
  const lastSession = sessions.find(s => new Date(s.scheduledAt) < new Date());
  const charges = await db.getChargesByStudentId(studentId);
  const pendingCharges = charges.filter(c => c.status === "pending" || c.status === "overdue").length;
  const memories = await db.getAiMemoriesByStudent(personalId, studentId);
  
  return {
    id: student.id,
    name: student.name,
    phone: student.phone || undefined,
    email: student.email || undefined,
    status: student.status,
    mainGoal: anamnesis?.mainGoal || undefined,
    secondaryGoals: anamnesis?.secondaryGoals || undefined,
    exerciseExperience: anamnesis?.exerciseExperience || undefined,
    medicalHistory: anamnesis?.medicalHistory || undefined,
    injuries: anamnesis?.injuries || undefined,
    latestMeasurement: latestMeasurement ? {
      weight: latestMeasurement.weight ? Number(latestMeasurement.weight) : undefined,
      bodyFat: latestMeasurement.bodyFat ? Number(latestMeasurement.bodyFat) : undefined,
      muscleMass: latestMeasurement.muscleMass ? Number(latestMeasurement.muscleMass) : undefined,
      measureDate: latestMeasurement.measureDate?.toString()
    } : undefined,
    currentWorkout: currentWorkout ? {
      name: currentWorkout.name,
      goal: currentWorkout.goal || undefined,
      frequency: undefined // Frequência calculada pelos dias do treino
    } : undefined,
    upcomingSessions: upcomingSessions.map(s => ({
      date: new Date(s.scheduledAt).toLocaleDateString("pt-BR"),
      time: new Date(s.scheduledAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      type: s.type || undefined
    })),
    lastSession: lastSession ? {
      date: new Date(lastSession.scheduledAt).toLocaleDateString("pt-BR"),
      attendance: lastSession.status || undefined
    } : undefined,
    pendingCharges,
    memories: memories.map(m => ({
      type: m.memoryType,
      key: m.key,
      value: m.value
    }))
  };
}

async function buildLeadContext(leadId: number, personalId: number): Promise<LeadContext> {
  const lead = await db.getLeadById(leadId);
  if (!lead) throw new Error("Lead not found");
  
  const memories = await db.getAiMemoriesByLead(personalId, leadId);
  
  return {
    id: lead.id,
    name: lead.name || undefined,
    phone: lead.phone,
    email: lead.email || undefined,
    mainGoal: lead.mainGoal || undefined,
    currentActivity: lead.currentActivity || undefined,
    availability: lead.availability || undefined,
    budget: lead.budget || undefined,
    urgency: lead.urgency || "medium",
    temperature: lead.temperature || "warm",
    status: lead.status || "new",
    evaluationScheduledAt: lead.evaluationScheduledAt || undefined,
    memories: memories.map(m => ({
      type: m.memoryType,
      key: m.key,
      value: m.value
    }))
  };
}

async function analyzeMessage(message: string, history: ConversationHistory[]): Promise<{
  intent?: string;
  sentiment?: "positive" | "neutral" | "negative";
  urgency?: "low" | "medium" | "high";
  shouldEscalate: boolean;
  escalationReason?: string;
  actions?: string[];
  memoriesToSave?: Array<{
    type: string;
    key: string;
    value: string;
    importance: string;
  }>;
}> {
  try {
    const prompt = buildAnalysisPrompt(message, history);
    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "message_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              intent: { type: "string" },
              sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
              urgency: { type: "string", enum: ["low", "medium", "high"] },
              shouldEscalate: { type: "boolean" },
              escalationReason: { type: "string" },
              memoriesToSave: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    key: { type: "string" },
                    value: { type: "string" },
                    importance: { type: "string" }
                  },
                  required: ["type", "key", "value", "importance"],
                  additionalProperties: false
                }
              }
            },
            required: ["intent", "sentiment", "urgency", "shouldEscalate"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0]?.message?.content;
    if (content && typeof content === "string") {
      try {
        return JSON.parse(content);
      } catch (parseError) {
        // Tentar extrair JSON do texto
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        throw parseError;
      }
    }
  } catch (error) {
    console.error("Error analyzing message:", error);
  }
  
  return {
    intent: "general",
    sentiment: "neutral",
    urgency: "low",
    shouldEscalate: false
  };
}

function shouldEscalateBasedOnRules(config: AiConfig, analysis: any, messageCount: number): boolean {
  // Escalar se muitas mensagens sem resolução
  if (messageCount >= config.escalateAfterMessages) {
    return true;
  }
  
  // Escalar se sentimento negativo e configurado para isso
  if (config.escalateOnSentiment && analysis.sentiment === "negative") {
    return true;
  }
  
  return false;
}

async function saveMessage(
  conversationId: number,
  sender: "user" | "ai" | "personal",
  message: string,
  messageType: string,
  metadata: any
): Promise<void> {
  await db.createAiMessage({
    conversationId,
    sender,
    message,
    messageType: messageType as any,
    ...metadata
  });
}

async function saveMemory(
  personalId: number,
  studentId: number | undefined,
  leadId: number | undefined,
  memory: { type: string; key: string; value: string; importance: string }
): Promise<void> {
  await db.createAiMemory({
    personalId,
    studentId,
    leadId,
    memoryType: memory.type as any,
    key: memory.key,
    value: memory.value,
    importance: memory.importance as any
  });
}

async function updateConversationStatus(conversationId: number, status: string, reason?: string): Promise<void> {
  await db.updateAiConversation(conversationId, {
    status: status as any,
    escalatedAt: status === "escalated" ? new Date() : undefined,
    escalationReason: reason
  });
}

async function updateConversationStats(conversationId: number): Promise<void> {
  const messages = await db.getAiMessagesByConversation(conversationId, 1000);
  const aiCount = messages.filter(m => m.sender === "ai").length;
  const humanCount = messages.filter(m => m.sender === "user" || m.sender === "personal").length;
  
  await db.updateAiConversation(conversationId, {
    messageCount: messages.length,
    aiMessageCount: aiCount,
    humanMessageCount: humanCount,
    lastMessageAt: new Date()
  });
}

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/\D/g, "");
  if (normalized.startsWith("55")) {
    normalized = normalized.substring(2);
  }
  return normalized;
}

// Função auxiliar para buscar personal por ID
async function getPersonalByIdInternal(personalId: number): Promise<any> {
  // Buscar personal usando função existente do db
  const allPersonals = await db.getAllPersonals();
  const personal = allPersonals.find((p: any) => p.id === personalId);
  return personal || null;
}

export default {
  processMessage,
  generateWelcomeMessage,
  getAiConfig
};
