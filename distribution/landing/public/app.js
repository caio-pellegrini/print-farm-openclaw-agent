const translations = {
  en: {
    skip: "Skip to content", "nav.aria": "Main navigation", "language.aria": "Choose language", "nav.workflow": "How it works", "nav.audience": "For print farms",
    "hero.kicker": "MADE FOR SMALL PRINT FARMS", "hero.title": "Your AI operations employee for your 3D print farm.", "hero.body": "Receive the STL, estimate the job, prepare a quote, and turn approved orders into work ready for production. Run your farm solo or with a team.", "hero.note": "For solo operators and small teams", "hero.deployNote": "For solo operators and small teams", "hero.free": "FREE DURING EARLY ACCESS", "hero.visual.aria": "Illustrative request flowing from a customer through the agent to farm preparation", "hero.visual.kicker": "ONE JOB · THREE HANDOFFS", "hero.visual.request": "4 × Black PLA", "hero.visual.attached": "Model attached", "hero.visual.agent": "PRINT FARM AGENT", "hero.visual.approved": "Quote approved", "hero.visual.order": "Order #137 · details together", "hero.visual.organized": "Job organized", "hero.visual.filament": "Check filament", "hero.visual.printer": "Prepare printer", "hero.visual.handoff": "Operator handoff", "hero.visual.foot": "REQUEST", "hero.visual.foot.approval": "APPROVAL", "hero.visual.foot.prep": "FARM PREP", "visual.customer": "Customer", "visual.farm": "Your farm",
    "cta.primary": "I run a print farm — test it free", "cta.deploy": "Deploy the agent", "cta.secondary": "Want to test it? Get in touch",
    "workflow.kicker": "A CLEARER WAY TO RUN EACH JOB", "workflow.title": "One request. A smoother operation.", "workflow.aside": "From custom STL requests to production handoff.",
    "flow.one.title": "Quote", "flow.one.body": "Analyze an STL and estimate material, print time, and price.", "flow.two.title": "Order", "flow.two.body": "Keep the approved quote, customer, and job details together.", "flow.three.title": "Production", "flow.three.body": "Turn approved work into a clear next step for the operator.",
    "progress.kicker": "EARLY ACCESS, WITH A CLEAR PICTURE", "progress.title": "What works today.", "progress.note": "Exercised locally with sample jobs. Print-time accuracy is still being checked.", "progress.works": "Working today", "progress.item.one": "STL analysis in OpenClaw", "progress.item.two": "Cura slicing and material estimates", "progress.item.three": "Quote calculation and saved estimates", "progress.next": "Coming next", "progress.next.one": "Customer file intake and quote approval", "progress.next.two": "Operator handoff and production workflow",
    "conversation.kicker": "A JOB, MOVING THROUGH THE FARM", "conversation.title": "From “can you print this?” to ready for production.", "conversation.body": "One operations employee keeps the customer conversation and the production handoff connected, while your people stay in control.", "conversation.example": "Illustrative example · sample values", "conversation.aria": "Illustrative customer conversation and operator handoff", "chat.today": "TODAY · 10:38 AM", "chat.customer.phone": "Customer conversation on a phone screen", "chat.customer.name": "Jordan · Customer", "chat.customer.online": "PRINT REQUEST", "chat.customer.text": "Hi! Could you print four of these in black PLA? I’ve attached the STL.", "chat.attachment": "3D model · 2.4 MB", "chat.agent": "PRINT FARM AGENT", "chat.quote": "Sure! Four in black PLA would be <strong>$32</strong>. Would you like me to get the job ready?", "chat.approval": "Sounds good — let’s go ahead.", "chat.customer.confirm": "Perfect. I’ll pass the job details to the farm team.", "chat.customer.status": "Quote approved · sent to the farm team", "chat.operator.phone": "Operator job handoff on a phone screen", "chat.operator.name": "Print farm team", "chat.operator.online": "PRODUCTION HANDOFF", "chat.operator.today": "NEW APPROVED JOB", "chat.handoff.label": "APPROVED JOB", "chat.printer.tag": "NEXT STEP · A1 #2", "chat.job.title": "4 × Black PLA", "chat.job.detail": "Part model · Customer order", "chat.job.time": "Estimated print time <strong>6h 20m</strong>", "chat.job.material": "Estimated material <strong>180g</strong>", "chat.handoff": "Suggested next step: check whether Bambu A1 #2 is available. Please verify the black PLA, clean bed, and printer readiness.", "chat.check.one": "Filament", "chat.check.two": "Clean bed", "chat.check.three": "Printer ready", "chat.ready": "All set — black PLA is loaded, the bed is clean, and the printer’s ready.", "chat.confirm": "Thanks — order #137 is ready to enter production.", "chat.operator.status": "Operator confirmed · ready for production",
    "invite.kicker": "FOR SMALL 3D PRINTING BUSINESSES", "invite.title": "Run it solo. Grow with a team.", "invite.body": "Built around real custom print jobs for owner/operators and small farm teams — especially if quotes, job details, and production steps live in too many places today.", "mode.solo.title": "Solo operation", "mode.solo.body": "You handle the owner and operator roles. The agent helps keep customer requests and job details together.", "mode.solo.owner": "You", "mode.solo.customer": "Customers", "mode.team.title": "Small team", "mode.team.body": "The agent connects the customer request to the operator preparing the job, while you stay informed.", "mode.team.customer": "Customer", "mode.team.operator": "Operator",
    "form.section": "Early tester options", "form.kicker": "EARLY ACCESS · FREE TO TEST", "form.title": "Try the agent free on your print farm.", "form.body": "We’re looking for small print businesses handling real custom jobs. Share your interest and we’ll help find a useful first workflow to try.", "form.direct.title": "Want to test it?", "form.direct.body": "A short form is all it takes to start the conversation.", "form.open": "I want to test it free", "contact.title": "Prefer to talk first?", "contact.body": "Reach me directly. No form needed.", "contact.discord": "Discord · @caiopellegrini", "contact.email": "Email", "contact.whatsapp": "WhatsApp", "form.summary": "Tell us a little about your farm", "form.summary.note": "Only a few details to get started", "form.name": "Name", "form.name.placeholder": "How should we address you?", "form.contact": "Email or preferred contact", "form.contact.placeholder": "Email, Discord, or WhatsApp", "form.printerCount": "Number of printers", "form.printerCount.placeholder": "Select a number", "form.models": "Printer brands / models", "form.models.placeholder": "e.g. Bambu A1, Prusa MK4", "form.customStl": "Do you accept custom STL jobs?", "form.yes": "Yes", "form.no": "No", "form.pain": "What’s the biggest pain in handling custom orders?", "form.pain.placeholder": "Quotes, tracking jobs, production handoff…", "form.submit": "Send my interest", "form.sending": "Sending…", "form.success": "Thanks — we’ve received your interest.", "form.required": "Please add your preferred contact method.", "form.network": "Couldn’t reach the form service. Check your connection and try again.",
    "footer.note": "Built for the people who keep print farms running.", "footer.hackathon": "Started during the OpenClaw 2.0 “Startup’s First Hire” Hackathon. Now inviting print farms to early testing."
  },
  pt: {
    skip: "Pular para o conteúdo", "nav.aria": "Navegação principal", "language.aria": "Escolher idioma", "nav.workflow": "Como funciona", "nav.audience": "Para farms de impressão",
    "hero.kicker": "FEITO PARA PEQUENAS FARMS DE IMPRESSÃO", "hero.title": "Seu agente de operações para sua farm de impressão 3D.", "hero.body": "Do STL ao orçamento e à preparação da produção, ele ajuda a organizar os pedidos, estimar os trabalhos e manter sua farm em movimento.", "hero.note": "Para quem opera sozinho ou com uma equipe", "hero.deployNote": "Para quem opera sozinho ou com uma equipe", "hero.free": "GRÁTIS DURANTE O ACESSO ANTECIPADO", "hero.visual.aria": "Pedido ilustrativo passando do cliente pelo agente até a preparação na farm", "hero.visual.kicker": "UM PEDIDO · TRÊS ETAPAS", "hero.visual.request": "4 × PLA preto", "hero.visual.attached": "Modelo anexado", "hero.visual.agent": "AGENTE DA FARM", "hero.visual.approved": "Orçamento aprovado", "hero.visual.order": "Pedido #137 · detalhes reunidos", "hero.visual.organized": "Pedido organizado", "hero.visual.filament": "Conferir filamento", "hero.visual.printer": "Preparar impressora", "hero.visual.handoff": "Encaminhado ao operador", "hero.visual.foot": "PEDIDO", "hero.visual.foot.approval": "APROVAÇÃO", "hero.visual.foot.prep": "PREPARAÇÃO", "visual.customer": "Cliente", "visual.farm": "Sua farm",
    "cta.primary": "Tenho uma farm — quero testar grátis", "cta.deploy": "Instalar o agente", "cta.secondary": "Quer testar? Fale com a gente",
    "workflow.kicker": "MAIS CLAREZA EM CADA PEDIDO", "workflow.title": "Um pedido. Uma operação mais fluida.", "workflow.aside": "Do STL personalizado à preparação para produção.",
    "flow.one.title": "Orçamento", "flow.one.body": "Analise um STL e estime material, tempo de impressão e preço.", "flow.two.title": "Pedido", "flow.two.body": "Reúna o orçamento aprovado, os dados do cliente e do trabalho.", "flow.three.title": "Produção", "flow.three.body": "Transforme o pedido aprovado em um próximo passo claro para quem opera.",
    "progress.kicker": "ACESSO ANTECIPADO, COM TRANSPARÊNCIA", "progress.title": "O que já funciona.", "progress.note": "Exercitado localmente com pedidos de exemplo. A precisão do tempo de impressão ainda está sendo verificada.", "progress.works": "Funcionando hoje", "progress.item.one": "Análise de STL no OpenClaw", "progress.item.two": "Fatiamento no Cura e estimativa de material", "progress.item.three": "Cálculo de orçamento e consulta de estimativas salvas", "progress.next": "A seguir", "progress.next.one": "Recebimento de arquivos e aprovação de orçamento pelo cliente", "progress.next.two": "Encaminhamento ao operador e fluxo de produção",
    "conversation.kicker": "UM PEDIDO PASSANDO PELA FARM", "conversation.title": "Do “consegue imprimir isso?” à preparação para produção.", "conversation.body": "Um agente de operações conecta a conversa com o cliente à preparação da produção, mantendo sua equipe no controle.", "conversation.example": "Exemplo ilustrativo · valores de exemplo", "conversation.aria": "Conversa ilustrativa com cliente e encaminhamento ao operador", "chat.today": "HOJE · 10:38", "chat.customer.phone": "Conversa com o cliente em uma tela de celular", "chat.customer.name": "João · Cliente", "chat.customer.online": "PEDIDO DE IMPRESSÃO", "chat.customer.text": "Oi! Você consegue imprimir quatro peças dessas em PLA preto? Anexei o STL.", "chat.attachment": "Modelo 3D · 2,4 MB", "chat.agent": "AGENTE DA FARM", "chat.quote": "Claro! As quatro peças em PLA preto ficam por <strong>R$ 32</strong>. Quer que eu deixe o pedido pronto?", "chat.approval": "Fechado, pode seguir.", "chat.customer.confirm": "Perfeito. Vou passar os detalhes para a equipe da farm.", "chat.customer.status": "Orçamento aprovado · enviado para a equipe", "chat.operator.phone": "Encaminhamento do pedido ao operador em uma tela de celular", "chat.operator.name": "Equipe da farm", "chat.operator.online": "PREPARAÇÃO DA PRODUÇÃO", "chat.operator.today": "NOVO PEDIDO APROVADO", "chat.handoff.label": "PEDIDO APROVADO", "chat.printer.tag": "PRÓXIMO PASSO · A1 #2", "chat.job.title": "4 × PLA preto", "chat.job.detail": "Modelo da peça · Pedido do cliente", "chat.job.time": "Tempo estimado <strong>6h20</strong>", "chat.job.material": "Material estimado <strong>180g</strong>", "chat.handoff": "Próximo passo sugerido: verificar se a Bambu A1 #2 está disponível. Confira o PLA preto, limpe a mesa e confirme se a impressora está pronta.", "chat.check.one": "Filamento", "chat.check.two": "Mesa limpa", "chat.check.three": "Impressora pronta", "chat.ready": "Tudo certo — o PLA preto está carregado, a mesa está limpa e a impressora está pronta.", "chat.confirm": "Obrigado — o pedido #137 está pronto para entrar na produção.", "chat.operator.status": "Operador confirmou · pronto para produção",
    "invite.kicker": "PARA PEQUENOS NEGÓCIOS DE IMPRESSÃO 3D", "invite.title": "Toque sozinho. Cresça com uma equipe.", "invite.body": "Feito para quem trabalha com pedidos personalizados, seja por conta própria ou com uma pequena equipe — especialmente se orçamentos, detalhes e etapas de produção ficam espalhados por vários lugares.", "mode.solo.title": "Operação solo", "mode.solo.body": "Você cuida da operação e da gestão. O agente ajuda a reunir pedidos de clientes e detalhes dos trabalhos.", "mode.solo.owner": "Você", "mode.solo.customer": "Clientes", "mode.team.title": "Pequena equipe", "mode.team.body": "O agente conecta o pedido do cliente a quem prepara o trabalho, enquanto você acompanha a operação.", "mode.team.customer": "Cliente", "mode.team.operator": "Operador",
    "form.section": "Opções para testadores", "form.kicker": "ACESSO ANTECIPADO · TESTE GRÁTIS", "form.title": "Teste o agente gratuitamente na sua farm.", "form.body": "Estamos procurando pequenos negócios que recebem pedidos personalizados de verdade. Conte que tem interesse e vamos encontrar um primeiro fluxo útil para testar.", "form.direct.title": "Quer testar?", "form.direct.body": "Um formulário curto é suficiente para começar a conversa.", "form.open": "Quero testar grátis", "contact.title": "Prefere conversar primeiro?", "contact.body": "Fale comigo diretamente. Sem formulário.", "contact.discord": "Discord · @caiopellegrini", "contact.email": "E-mail", "contact.whatsapp": "WhatsApp", "form.summary": "Conte um pouco sobre sua farm", "form.summary.note": "Só algumas informações para começar", "form.name": "Nome", "form.name.placeholder": "Como podemos chamar você?", "form.contact": "E-mail ou contato de preferência", "form.contact.placeholder": "E-mail, Discord ou WhatsApp", "form.printerCount": "Quantidade de impressoras", "form.printerCount.placeholder": "Selecione uma quantidade", "form.models": "Marcas e modelos das impressoras", "form.models.placeholder": "Ex.: Bambu A1, Prusa MK4", "form.customStl": "Você aceita pedidos com STL personalizado?", "form.yes": "Sim", "form.no": "Não", "form.pain": "Qual é a parte mais difícil de lidar com pedidos personalizados?", "form.pain.placeholder": "Orçamentos, acompanhar pedidos, preparar a produção…", "form.submit": "Enviar meu interesse", "form.sending": "Enviando…", "form.success": "Obrigado — recebemos seu interesse.", "form.required": "Informe uma forma de contato.", "form.network": "Não foi possível acessar o formulário. Confira sua conexão e tente novamente.",
    "footer.note": "Feito para quem mantém as farms de impressão funcionando.", "footer.hackathon": "Começou durante o hackathon OpenClaw 2.0 “Startup’s First Hire”. Agora estamos convidando farms para os primeiros testes."
  }
};

let currentLanguage = "en";
const landingConfig = window.landingConfig || { ctaMode: "beta", deployUrl: "", contactLinks: {} };
const form = document.querySelector("#tester-intake");
const feedback = document.querySelector("#form-feedback");
const testerDetails = document.querySelector(".tester-form-details");

function setLanguage(language) {
  currentLanguage = translations[language] ? language : "en";
  const copy = translations[currentLanguage];
  document.documentElement.lang = currentLanguage === "pt" ? "pt-BR" : "en";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = copy[element.dataset.i18n];
    if (value !== undefined) element.innerHTML = value;
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const value = copy[element.dataset.i18nPlaceholder];
    if (value !== undefined) element.placeholder = value;
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const value = copy[element.dataset.i18nAria];
    if (value !== undefined) element.setAttribute("aria-label", value);
  });
  document.querySelectorAll("[data-language]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.language === currentLanguage));
  });
  document.title = currentLanguage === "pt" ? "Agente de Operações para Farms de Impressão 3D" : "3D Print Farm AI Operations Employee";
  const description = currentLanguage === "pt"
    ? "Um agente de operações para farms de impressão 3D: organize pedidos personalizados, estime trabalhos e prepare a produção."
    : "An AI operations employee for small 3D print farms — quote custom STL jobs, organize orders, and prepare production.";
  document.querySelector('meta[name="description"]').content = description;
  document.querySelector('meta[property="og:title"]').content = document.title;
  document.querySelector('meta[property="og:description"]').content = description;
  document.querySelector('meta[property="og:locale"]').content = currentLanguage === "pt" ? "pt_BR" : "en_US";
  if (landingConfig.ctaMode === "deploy" && landingConfig.deployUrl) document.querySelector(".hero-note").innerHTML = copy["hero.deployNote"];
  if (feedback.textContent) feedback.textContent = "";
}

function openTesterForm() {
  testerDetails.open = true;
  window.setTimeout(() => document.querySelector("#short-tester-form").scrollIntoView({ behavior: "smooth", block: "center" }), 0);
}

document.querySelectorAll("[data-language]").forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.language)));
document.querySelectorAll('a[href="#tester-form"]').forEach((link) => link.addEventListener("click", () => { testerDetails.open = true; }));
document.querySelector(".form-open").addEventListener("click", openTesterForm);

function safePublicUrl(value, hostnames) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || !hostnames.includes(url.hostname.toLowerCase())) return "";
    return url.href;
  } catch { return ""; }
}

function setupContactLinks() {
  const config = landingConfig.contactLinks || {};
  const links = {
    discord: safePublicUrl(config.discordUrl, ["discord.com", "discord.gg"]),
    email: typeof config.email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email.trim()) ? `mailto:${config.email.trim()}` : "",
    whatsapp: safePublicUrl(config.whatsappUrl, ["wa.me", "api.whatsapp.com"])
  };
  for (const [key, href] of Object.entries(links)) {
    const link = document.querySelector(`[data-contact="${key}"]`);
    if (href) {
      link.href = href;
      link.hidden = false;
      if (key !== "email") { link.target = "_blank"; link.rel = "noopener noreferrer"; }
    }
  }
  document.querySelector("#contact-options").hidden = !Object.values(links).some(Boolean);
}

if (landingConfig.ctaMode === "deploy" && landingConfig.deployUrl) {
  const deployButton = document.querySelector(".deploy-cta");
  deployButton.href = landingConfig.deployUrl;
  deployButton.hidden = false;
  document.querySelector(".beta-cta").hidden = true;
  document.querySelector(".beta-secondary").hidden = false;
  document.querySelector(".free-pill").hidden = true;
  document.querySelector(".hero-note").innerHTML = translations[currentLanguage]["hero.deployNote"];
}
setupContactLinks();
document.querySelector("#year").textContent = new Date().getFullYear();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  feedback.classList.remove("error");
  if (!form.reportValidity()) {
    feedback.textContent = translations[currentLanguage]["form.required"];
    return;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = translations[currentLanguage]["form.sending"];
  const fields = Object.fromEntries(new FormData(form).entries());
  fields.printerCount = Number(fields.printerCount);
  try {
    const response = await fetch("/api/testers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields)
    });
    if (!response.ok) throw new Error("Submission failed");
    await response.json();
    form.reset();
    feedback.textContent = translations[currentLanguage]["form.success"];
  } catch {
    feedback.textContent = translations[currentLanguage]["form.network"];
    feedback.classList.add("error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = translations[currentLanguage]["form.submit"];
  }
});
