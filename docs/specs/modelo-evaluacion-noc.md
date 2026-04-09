# Modelo de Evaluación
## Pivote NOC Nivel 1 → Analista de Observabilidad Junior
### CoE de Observabilidad | Equipo de Delivery MSP

---

## 1. PROPÓSITO DEL MODELO

Este modelo tiene como objetivo evaluar a los integrantes del equipo de NOC / Soporte Nivel 1 para determinar su **aptitud y preparación para pivotar al rol de Analista de Observabilidad Junior** en el equipo de Delivery. La evaluación considera tres dimensiones: técnica, habilidades blandas y actitudinal. El resultado clasifica a cada persona en una de tres categorías de decisión.

---

## 2. CRITERIOS DE ELEGIBILIDAD BASE (Filtro Previo)

Antes de aplicar la evaluación, el candidato debe cumplir al menos uno de los siguientes requisitos de formación académica:

| Nivel | Descripción | ¿Elegible? |
|---|---|---|
| Técnico SENA | Sistemas, Redes, Infraestructura o afín | ✅ Mínimo requerido |
| Tecnólogo | Cualquier área TI | ✅ |
| Profesional / Ingeniería | Sistemas, Electrónica, Telecomunicaciones o afín | ✅ |
| Bachiller sin formación TI | — | ❌ No elegible en esta convocatoria |

> **Nota:** La experiencia práctica en su rol actual puede compensar el nivel académico mínimo si el evaluador lo justifica documentadamente.

---

## 3. ESTRUCTURA DE LA EVALUACIÓN

| Dimensión | Peso | Descripción |
|---|---|---|
| **A. Técnica** | 50% | Conocimientos y habilidades operativas en infraestructura, sistemas y herramientas |
| **B. Habilidades Blandas** | 30% | Comunicación, documentación, trabajo en equipo y orientación al cliente |
| **C. Actitudinal** | 20% | Adaptabilidad, aprendizaje autónomo y disposición al cambio de rol |

**Puntaje Total Máximo: 100 puntos**

---

## 4. DIMENSIÓN A — TÉCNICA (50 puntos)

### Escala de Valoración por Competencia

| Nivel | Puntaje | Descripción |
|---|---|---|
| 0 — Sin conocimiento | 0 | No conoce el concepto ni ha tenido contacto |
| 1 — Básico | 1 | Ha escuchado el concepto, puede describirlo pero no lo ha aplicado |
| 2 — Funcional | 2 | Lo ha aplicado en contexto real con supervisión |
| 3 — Autónomo | 3 | Lo aplica sin supervisión y puede explicarlo a otros |

---

### A1. Fundamentos de Infraestructura y Sistemas (15 puntos)

| # | Competencia | 0 | 1 | 2 | 3 | Evidencia / Comentario |
|---|---|---|---|---|---|---|
| A1.1 | Administración básica de Linux (navegar filesystem, permisos, procesos, logs del sistema) | | | | | |
| A1.2 | Administración básica de Windows Server (servicios, visor de eventos) | | | | | |
| A1.3 | Fundamentos de redes: modelo OSI, TCP/IP, puertos, DNS, HTTP/S | | | | | |
| A1.4 | Conocimiento básico de contenedores: ¿qué es Docker y para qué se usa? | | | | | |
| A1.5 | Conocimiento básico de Cloud: ¿qué es IaaS/PaaS/SaaS? Diferencia entre on-premise y cloud | | | | | |
| **Subtotal A1** | | | | | **/15** | |

---

### A2. Observabilidad y Monitoreo (15 puntos)

| # | Competencia | 0 | 1 | 2 | 3 | Evidencia / Comentario |
|---|---|---|---|---|---|---|
| A2.1 | Diferencia entre monitoreo reactivo y observabilidad proactiva | | | | | |
| A2.2 | Conoce los tres pilares: Métricas, Logs y Trazas (puede definir cada uno) | | | | | |
| A2.3 | Uso de Grafana OSS: navegación, lectura de dashboards, filtros básicos | | | | | |
| A2.4 | Uso de Elasticsearch/Kibana: búsqueda de logs, filtros por campo y rango de tiempo | | | | | |
| A2.5 | Interpretación de alertas: entiende qué indica una alerta más allá de solo escalarla | | | | | |
| **Subtotal A2** | | | | | **/15** | |

---

### A3. Herramientas y Automatización Básica (10 puntos)

| # | Competencia | 0 | 1 | 2 | 3 | Evidencia / Comentario |
|---|---|---|---|---|---|---|
| A3.1 | Uso de Git básico: clonar repositorio, crear rama, commit, push | | | | | |
| A3.2 | Scripting básico en Bash o Python: puede leer y ejecutar un script sencillo | | | | | |
| A3.3 | Gestión de tickets en GLPI: registra, categoriza y escala correctamente | | | | | |
| A3.4 | Uso de herramientas de colaboración: Confluence/Wiki para documentar procedimientos | | | | | |
| **Subtotal A3** | | | | | **/10** (máx. sobre 12, normalizado) | |

> **Nota de normalización A3:** El máximo real es 12 puntos. Para obtener el puntaje sobre 10, aplicar: *(Puntaje obtenido / 12) × 10*

---

### A4. Pensamiento Analítico Técnico (10 puntos)

*Esta sección se evalúa mediante una situación práctica presentada en la entrevista.*

**Caso práctico sugerido:**
> "Se recibe una alerta de alto consumo de CPU en un servidor de producción. El dashboard de Grafana muestra el spike. ¿Cuáles serían tus primeros pasos para investigar la causa? ¿Qué información buscarías y dónde?"

| Criterio de evaluación | 0 | 2 | 4 | 5 | Comentario |
|---|---|---|---|---|---|
| Identifica fuentes de información relevantes (logs, métricas, procesos) | | | | | |
| Propone una secuencia lógica de investigación | | | | | |
| Diferencia entre síntoma y causa raíz | | | | | |
| **Subtotal A4** | | | | | **/10** |

---

## 5. DIMENSIÓN B — HABILIDADES BLANDAS (30 puntos)

### Escala de Valoración

| Nivel | Puntaje | Descripción |
|---|---|---|
| 1 — Por desarrollar | 1–2 | Habilidad ausente o muy débil |
| 2 — En desarrollo | 3–4 | Presente pero inconsistente |
| 3 — Competente | 5–6 | Habilidad sólida y consistente |
| 4 — Destacado | 7 | Habilidad sobresaliente, puede modelarla |

---

### B1. Comunicación Técnica Escrita (7 puntos)

**Instrucción para el evaluador:** Entrega al candidato el siguiente escenario por escrito y dale **10 minutos** para redactar el registro del incidente como si lo fuera a ingresar en GLPI. No orientes ni corrijas durante el ejercicio. Evalúa el resultado con la rúbrica al final.

---

**📋 Escenario para entregar al candidato:**

> Son las 2:47 a.m. del martes. Recibes una alerta por correo con el asunto: *"CRITICAL – High CPU Usage – srv-prod-payments-01"*.
>
> Abres Grafana y ves que el CPU del servidor lleva 23 minutos por encima del 94%. Revisas los logs en Elasticsearch y encuentras que hay un proceso llamado `java_billing_worker` que está generando excepciones repetidas cada 3 segundos con el mensaje `OutOfMemoryError: Java heap space`.
>
> Intentas contactar al ingeniero de turno de la aplicación según la matriz de escalamiento en Excel, pero no contesta. Llamas al respaldo y este te indica que va a revisar. A las 3:15 a.m. el ingeniero confirma que hizo un rollback del último despliegue y el CPU vuelve a niveles normales (18%). El servicio de pagos estuvo degradado durante 28 minutos.
>
> **Tu tarea:** Documenta este incidente en GLPI de la forma más completa posible.

---

**Rúbrica de evaluación B1:**

| Criterio | Por desarrollar (1) | En desarrollo (2) | Competente (3) | Destacado (4) |
|---|---|---|---|---|
| **Estructura del registro** | Solo describe lo que pasó sin orden | Tiene inicio y fin pero le faltan campos clave | Cubre todos los campos relevantes del ticket | Estructura clara, reutilizable como plantilla |
| **Precisión técnica** | Omite datos técnicos o los confunde | Menciona el error pero sin contexto (proceso, duración) | Incluye proceso, error, duración y métricas | Incluye evidencia técnica y cronología completa |
| **Acciones documentadas** | Solo el problema, sin acciones tomadas | Menciona que escaló pero sin detalle | Documenta pasos propios y respuesta del escalado | Cronología de acciones con responsables y tiempos |
| **Impacto descrito** | No menciona el impacto al servicio | Menciona que hubo impacto sin cuantificar | Indica servicio afectado y duración | Cuantifica afectación con datos concretos |

> **Puntaje B1:** Suma los puntos de cada criterio (máx. 16) y normaliza sobre 7: *(Puntaje / 16) × 7*

**Puntaje B1:** _______ / 7

---

### B2. Comunicación Verbal Técnica (7 puntos)

**Instrucción para el evaluador:** Usando el mismo escenario del incidente de B1 (que el candidato ya conoce), pídele que te lo explique verbalmente como si tú fueras el gerente de cuenta del cliente afectado, que no tiene perfil técnico. Dale máximo 5 minutos para la explicación. Evalúa con la siguiente rúbrica.

---

**Pregunta de apertura para el evaluador:**
> "Imagina que soy el gerente de cuenta del cliente. Son las 9 a.m. y quiero saber qué pasó anoche con el servicio de pagos. Explícamelo."

**Rúbrica de evaluación B2:**

| Criterio | Por desarrollar (1) | En desarrollo (2) | Competente (3) | Destacado (4) |
|---|---|---|---|---|
| **Claridad del lenguaje** | Usa jerga técnica sin traducirla | Intenta simplificar pero pierde precisión | Explica sin tecnicismos manteniendo los hechos | Lenguaje claro, empático y orientado al impacto de negocio |
| **Estructura narrativa** | Relata sin orden cronológico | Hay un hilo pero con saltos o confusión | Explica qué pasó, qué se hizo y cómo quedó | Narrativa fluida con inicio, nudo, resolución y estado actual |
| **Manejo de la incertidumbre** | Inventa datos o evita lo que no sabe | Reconoce que no sabe pero no propone seguimiento | Reconoce los límites de su conocimiento con honestidad | Reconoce lo que no sabe y propone cómo se obtendrá la información |
| **Transmisión del impacto** | No menciona el impacto al cliente | Menciona que hubo impacto sin contexto | Comunica duración y servicio afectado con claridad | Comunica impacto, acciones tomadas y cierre con tranquilidad |

> **Puntaje B2:** Suma los puntos de cada criterio (máx. 16) y normaliza sobre 7: *(Puntaje / 16) × 7*

**Puntaje B2:** _______ / 7

---

### B3. Orientación al Cliente Interno/Externo (4 puntos)

**Instrucción para el evaluador:** Esta competencia se evalúa mediante conversación directa. Usa las preguntas guía para explorar comportamientos reales. No se trata de obtener respuestas correctas, sino de entender cómo el candidato se relaciona con quienes dependen de su trabajo.

**Preguntas guía:**

1. "¿Cuándo alguien de otro equipo te pide algo urgente mientras estás gestionando otra alerta, cómo manejas esa situación?"
2. "¿Recuerdas algún caso en el que alguien (un ingeniero, un líder, alguien del cliente) quedó insatisfecho con tu respuesta o atención? ¿Qué pasó y cómo lo manejaste?"
3. "¿Cómo sabes cuando alguien realmente entendió lo que le explicaste?"

**Indicadores de calificación:**

| Puntaje | Lo que el evaluador debe observar |
|---|---|
| **4 — Destacado** | Describe situaciones reales donde priorizó activamente la experiencia del otro. Reconoce cuando falló y explica qué corrigió. Verifica que el mensaje llegó bien. |
| **3 — Competente** | Tiene conciencia del impacto de su trabajo en otros. Responde con ejemplos aunque sin profundidad en la reflexión. |
| **2 — En desarrollo** | Cumple su función pero de forma transaccional. No reflexiona sobre la experiencia del otro, solo sobre si completó la tarea. |
| **1 — Por desarrollar** | Respuestas centradas exclusivamente en el proceso o la herramienta. No aparece el otro en su relato. |

**Puntaje B3:** _______ / 4

---

### B4. Trabajo en Equipo (4 puntos)

**Instrucción para el evaluador:** Explora cómo el candidato se comporta dentro del equipo de soporte, especialmente en situaciones de presión o cuando las responsabilidades no están del todo claras.

**Preguntas guía:**

1. "Cuéntame de una situación en la que apoyaste a un compañero con algo que técnicamente no era tu responsabilidad. ¿Por qué lo hiciste?"
2. "¿Hay algo que sientas que el equipo podría hacer mejor? ¿Lo has mencionado alguna vez?"
3. "Cuando hay mucha carga de alertas simultáneas, ¿cómo se organiza el equipo? ¿Cuál es tu rol en esos momentos?"

**Indicadores de calificación:**

| Puntaje | Lo que el evaluador debe observar |
|---|---|
| **4 — Destacado** | Tiene conciencia del equipo como sistema. Actúa proactivamente para aliviar carga de otros. Ha propuesto mejoras. En caos, toma iniciativa de coordinación. |
| **3 — Competente** | Colabora cuando se le pide. Tiene buena relación con el equipo. Participa pero no lidera. |
| **2 — En desarrollo** | Cumple su turno y sus tareas. La colaboración es puntual y no habitual. |
| **1 — Por desarrollar** | Perfil individualista. No reporta conciencia del equipo más allá de su propia tarea. |

**Puntaje B4:** _______ / 4

---

### B5. Gestión del Tiempo y Priorización (4 puntos)

**Instrucción para el evaluador:** En un equipo NOC es habitual recibir múltiples alertas simultáneas. Explora cómo el candidato decide qué atender primero y cómo maneja la presión.

**Preguntas guía:**

1. "Describe un turno en el que recibiste muchas alertas al mismo tiempo. ¿Cómo decidiste cuál atender primero?"
2. "¿Alguna vez sentiste que algo se te fue de las manos porque estabas atendiendo otra cosa? ¿Qué aprendiste de eso?"
3. "¿Tienes algún método personal para no perder el hilo cuando estás gestionando varios incidentes a la vez?"

**Indicadores de calificación:**

| Puntaje | Lo que el evaluador debe observar |
|---|---|
| **4 — Destacado** | Tiene un criterio claro de priorización (impacto, urgencia, cliente). Lo aplica consistentemente. Aprendió de errores de priorización pasados. Usa algún método o herramienta de apoyo. |
| **3 — Competente** | Prioriza con criterio básico (lo más urgente primero). Reconoce cuando necesita apoyo. |
| **2 — En desarrollo** | Prioriza por orden de llegada o por lo más visible. Sin criterio estructurado. |
| **1 — Por desarrollar** | No tiene criterio de priorización claro. Reporta sensación de caos sin mecanismos de respuesta. |

**Puntaje B5:** _______ / 4

---

### B6. Documentación y Orden (4 puntos)

**Instrucción para el evaluador:** Esta competencia se puede validar parcialmente revisando tickets reales del candidato en GLPI antes de la entrevista. Durante la conversación, profundiza en sus hábitos.

**Preguntas guía:**

1. "¿Cómo decides qué nivel de detalle poner en un ticket? ¿Hay alguna diferencia entre lo que registras de noche versus de día?"
2. "¿Alguna vez alguien (un compañero, tu líder) tuvo que pedirte que completaras o mejorara un registro que hiciste? ¿Qué pasó?"
3. "Si mañana no puedes venir al trabajo y hay un incidente abierto que dejaste la noche anterior, ¿qué tan fácil sería para un compañero retomarlo con lo que dejaste documentado?"

**Indicadores de calificación:**

| Puntaje | Lo que el evaluador debe observar |
|---|---|
| **4 — Destacado** | Documenta pensando en quien viene después. Sus tickets son autoexplicativos. Tiene criterio propio sobre qué es un buen registro. No necesita que le pidan completar. |
| **3 — Competente** | Documenta de forma consistente aunque con variaciones de calidad. Acepta retroalimentación y la incorpora. |
| **2 — En desarrollo** | Documenta lo mínimo. Requiere recordatorio. Los tickets son entendibles solo con contexto adicional. |
| **1 — Por desarrollar** | Documentación incompleta o ausente de forma habitual. Hay que pedirle que complete. |

**Puntaje B6:** _______ / 4

---

### Consolidación Dimensión B

| Competencia | Puntaje Obtenido | Máximo |
|---|---|---|
| B1. Comunicación escrita | | 7 |
| B2. Comunicación verbal | | 7 |
| B3. Orientación al cliente | | 4 |
| B4. Trabajo en equipo | | 4 |
| B5. Gestión del tiempo | | 4 |
| B6. Documentación y orden | | 4 |
| **Total B** | | **/30** |

---

## 6. DIMENSIÓN C — ACTITUDINAL (20 puntos)

*Evaluada mediante entrevista estructurada con preguntas por comportamiento. El candidato **no sabe que está siendo evaluado para un posible cambio de rol**, por lo que las preguntas están formuladas como conversación de desarrollo profesional.*

### Guía de Puntuación para el Evaluador

Cada competencia actitudinal se puntúa de 0 a 5. A continuación se define con precisión qué corresponde a cada puntaje, tomando como referencia los indicadores positivos y de alerta.

**Escala general:**

| Puntaje | Criterio |
|---|---|
| **5** | Todos los indicadores positivos presentes. Respuesta con ejemplo concreto, reflexión genuina y evidencia de aplicación real. |
| **4** | La mayoría de indicadores positivos presentes. Ejemplo concreto pero con algún elemento que falta o sin reflexión profunda. |
| **3** | Mezcla equilibrada: algunos indicadores positivos y alguno de alerta. Respuesta general sin profundidad. |
| **2** | Predominan los indicadores de alerta. La respuesta existe pero es vaga, reactiva o sin evidencia real. |
| **1** | Casi todos los indicadores de alerta presentes. Respuesta defensiva, sin ejemplos o contradictoria. |
| **0** | No responde, evita la pregunta o la respuesta es completamente incompatible con el perfil. |

---

### C1. Disposición al Aprendizaje Autónomo (0–5 puntos)

**Pregunta de apertura:**
> "Fuera del trabajo, ¿hay algo relacionado con tecnología que hayas aprendido por tu cuenta últimamente? ¿Qué te motivó a aprenderlo?"

**Preguntas de profundización:**
- "¿Cómo lo aprendiste? ¿Usaste algún recurso en particular?"
- "¿Lo aplicaste en algo concreto, ya sea en el trabajo o en un proyecto personal?"
- "¿Se lo contaste o enseñaste a alguien?"

| Indicadores positivos ✅ | Indicadores de alerta 🚨 |
|---|---|
| Menciona fuentes concretas (curso, video, documentación, práctica en lab) | "No he tenido tiempo" como respuesta principal |
| El aprendizaje fue auto-motivado, no por obligación laboral | Solo aprende cuando el trabajo lo exige |
| Hay aplicación real, aunque sea en proyecto personal | Conocimiento puramente teórico sin aplicación |
| Lo comparte con otros de forma natural | El aprendizaje es solitario y sin reflexión sobre el uso |

**Guía de puntuación C1:**

| Puntaje | Descripción concreta |
|---|---|
| **5** | Da un ejemplo específico con fuente, contexto y aplicación. Comparte lo que aprende. El aprendizaje es un hábito, no un evento. |
| **4** | Tiene ejemplo concreto con fuente y aplicación pero no profundiza en el hábito o en compartirlo. |
| **3** | Aprendió algo pero fue motivado por el trabajo. No hay evidencia de aprendizaje por iniciativa propia. |
| **2** | Respuesta vaga ("a veces veo videos") sin ejemplo concreto ni aplicación verificable. |
| **1** | No recuerda haber aprendido nada por su cuenta recientemente. No muestra interés en el tema. |
| **0** | Expresa activamente que no le interesa aprender más de lo necesario para su trabajo actual. |

**Puntaje C1:** _______ / 5

---

### C2. Adaptabilidad al Cambio (0–5 puntos)

**Pregunta de apertura:**
> "En el tiempo que llevas en Soporte Nivel 1, ¿ha habido algún cambio en cómo trabajan, en los procesos o en las herramientas? ¿Cómo te fue con eso?"

**Preguntas de profundización:**
- "¿Qué fue lo más difícil de ese cambio?"
- "¿Hubo algo que hicieras tú específicamente para adaptarte más rápido?"
- "Si hoy llegara un cambio grande en tu forma de trabajar, ¿qué sería lo primero que harías?"

| Indicadores positivos ✅ | Indicadores de alerta 🚨 |
|---|---|
| Describe acciones concretas que tomó para adaptarse | La resistencia o la queja es el centro del relato |
| Reconoce la dificultad pero la enmarca como aprendizaje | Esperó pasivamente que el cambio "pasara" |
| Propuso algo o ayudó a otros durante la transición | Percibe el cambio como algo que le pasa, no algo que puede manejar |
| Tiene reflexión sobre cómo mejoraría su respuesta futura | Cada cambio pasado fue vivido como negativo sin aprendizaje |

**Guía de puntuación C2:**

| Puntaje | Descripción concreta |
|---|---|
| **5** | Describe un cambio real con dificultades concretas, acciones tomadas y reflexión sobre lo aprendido. Tiene una actitud proactiva ante cambios futuros. |
| **4** | Tiene ejemplo real y lo manejó bien, pero la reflexión es superficial o no hay evidencia de que propuso algo. |
| **3** | Se adaptó al cambio pero de forma pasiva ("me tocó y lo hice"). No hay iniciativa propia. |
| **2** | El relato está dominado por la incomodidad. Se adaptó pero con resistencia significativa y sin aprendizaje explícito. |
| **1** | Expresa resistencia al cambio sin mitigantes. No reconoce ningún valor en los cambios pasados. |
| **0** | Declara explícitamente que no le gustan los cambios o que preferiría que las cosas sigan igual. |

**Puntaje C2:** _______ / 5

---

### C3. Aspiraciones de Crecimiento Profesional (0–5 puntos)

**Instrucción para el evaluador:** Esta pregunta reemplaza la de "motivación por el nuevo rol" ya que el candidato no sabe que está siendo evaluado para un cambio de área. El objetivo es entender hacia dónde quiere crecer y si ese vector es compatible con observabilidad.

**Pregunta de apertura:**
> "Si pudieras elegir en qué dirección crecer profesionalmente dentro del mundo de la tecnología, ¿hacia dónde irías? ¿Hay algo que te llame la atención o que te gustaría aprender?"

**Preguntas de profundización:**
- "¿Por qué esa área en particular?"
- "¿Hay algo de lo que haces hoy en soporte que sientas que podría conectarse con ese camino?"
- "¿Has hecho algo concreto para acercarte a eso, aunque sea pequeño?"

| Indicadores positivos ✅ | Indicadores de alerta 🚨 |
|---|---|
| Tiene una dirección clara aunque no sea observabilidad (infraestructura, DevOps, cloud, seguridad) | "No sé" o "donde haya trabajo" como respuesta principal |
| Puede explicar por qué le interesa esa área | Motivación exclusivamente económica sin curiosidad técnica |
| Conecta algo de su trabajo actual con sus aspiraciones | No ve ninguna relación entre lo que hace hoy y lo que quiere |
| Ha dado algún paso concreto, por pequeño que sea | Solo aspiraciones sin ninguna acción |

**Guía de puntuación C3:**

| Puntaje | Descripción concreta |
|---|---|
| **5** | Tiene una dirección clara y compatible con observabilidad (infraestructura, cloud, automatización, DevOps, SRE). Ha dado pasos concretos. Conecta su trabajo actual con ese camino. |
| **4** | Tiene dirección clara y la argumenta bien, pero aún no ha dado pasos concretos. La dirección es compatible. |
| **3** | Tiene aspiraciones pero difusas. No ha actuado sobre ellas. La dirección puede o no ser compatible. |
| **2** | Aspiraciones principalmente externas (salario, estabilidad) sin componente de curiosidad técnica. |
| **1** | No tiene dirección clara. Respuesta vaga sin reflexión sobre el propio desarrollo. |
| **0** | No le interesa crecer o cambiar. Está cómodo con el statu quo sin ninguna aspiración técnica. |

**Puntaje C3:** _______ / 5

---

### C4. Tolerancia a la Incertidumbre y Resolución de Problemas (0–5 puntos)

**Pregunta de apertura:**
> "Cuéntame de una situación en tu rol actual en la que recibiste una alerta que no sabías cómo manejar y no había nadie disponible para ayudarte en ese momento. ¿Qué hiciste?"

**Preguntas de profundización:**
- "¿Qué fue lo primero que hiciste antes de escalar?"
- "¿Dejaste algún registro de lo que investigaste?"
- "¿Qué harías diferente si volviera a pasar?"

| Indicadores positivos ✅ | Indicadores de alerta 🚨 |
|---|---|
| Buscó información por su cuenta antes de escalar | Escala inmediatamente sin ninguna investigación previa |
| Documentó lo que encontró aunque no resolviera el problema | No dejó rastro de sus acciones |
| Escaló con contexto (qué encontró, qué intentó) | Escaló con "hay un problema" sin información adicional |
| Reflexiona sobre qué haría distinto | No extrae aprendizaje de la situación |

**Guía de puntuación C4:**

| Puntaje | Descripción concreta |
|---|---|
| **5** | Describe acciones concretas de investigación antes de escalar. Escaló con contexto claro. Documentó. Tiene reflexión sobre mejora. |
| **4** | Investigó y escaló con contexto, pero no documentó o la reflexión posterior es superficial. |
| **3** | Investigó brevemente pero escaló rápido. El escalamiento fue con algo de contexto pero incompleto. |
| **2** | Escaló rápidamente con poco o ningún intento de investigación previa. No hay evidencia de documentación. |
| **1** | Escaló inmediatamente sin investigar. No reconoce que debería haber hecho algo diferente. |
| **0** | Describe parálisis o confusión total sin ninguna acción tomada. |

**Puntaje C4:** _______ / 5

---

### Consolidación Dimensión C

| Competencia | Puntaje Obtenido | Máximo |
|---|---|---|
| C1. Disposición al aprendizaje autónomo | | 5 |
| C2. Adaptabilidad al cambio | | 5 |
| C3. Aspiraciones de crecimiento profesional | | 5 |
| C4. Tolerancia a la incertidumbre | | 5 |
| **Total C** | | **/20** |

---

## 7. SECCIÓN COMPLEMENTARIA — USO E INCORPORACIÓN DE IA (10 puntos)

> Esta sección **no afecta los pesos de las dimensiones A, B y C**. Su puntaje se reporta de forma independiente en la ficha individual y se usa como **criterio de desempate** cuando dos candidatos queden en el mismo rango de decisión. También sirve para diseñar el onboarding diferenciado de quienes ya tienen hábitos de uso de IA.

---

### Contexto para el evaluador

No se espera que el equipo de soporte base tenga conocimiento técnico avanzado de IA. Lo que se evalúa es:
- Si ya usan herramientas de IA como asistentes en su trabajo o vida personal
- Si tienen criterio para validar lo que la IA les responde
- Si ven la IA como una herramienta de crecimiento o como una amenaza

La evaluación combina una **pregunta práctica** (componente técnico) y una **conversación de actitud** (componente actitudinal).

---

### IA-1. Actitud frente a la IA como Herramienta de Trabajo (0–5 puntos)

**Pregunta de apertura:**
> "¿Usas alguna herramienta de inteligencia artificial en tu trabajo o en tu vida personal? ¿Para qué?"

**Preguntas de profundización:**
- "¿Hubo algún momento en que la IA te dio una respuesta que estaba mal o que no tenía sentido? ¿Cómo te diste cuenta?"
- "¿Crees que herramientas como ChatGPT o Copilot pueden ayudarte a hacer mejor tu trabajo técnico? ¿De qué forma?"
- "¿Te genera alguna preocupación el hecho de que la IA esté siendo usada cada vez más en tecnología?"

| Indicadores positivos ✅ | Indicadores de alerta 🚨 |
|---|---|
| Ya usa IA para algo concreto (buscar información, redactar, entender errores) | Nunca la ha usado y no muestra curiosidad por hacerlo |
| Ha notado alguna vez que la IA se equivocó y lo puede explicar | Acepta todo lo que la IA dice sin filtro crítico |
| Ve la IA como un asistente que le ahorra tiempo o le ayuda a aprender | Ve la IA como una amenaza a su trabajo sin matices |
| Tiene curiosidad por aprender a usarla mejor | Desinterés total o rechazo activo |

**Guía de puntuación IA-1:**

| Puntaje | Descripción concreta |
|---|---|
| **5** | Usa IA regularmente con ejemplos concretos. Tiene pensamiento crítico sobre sus limitaciones. La ve como palanca de crecimiento y quiere aprender más. |
| **4** | Usa IA ocasionalmente con ejemplo concreto. Entiende que puede equivocarse. Actitud positiva aunque no la explora activamente. |
| **3** | Ha usado IA pero de forma esporádica o superficial. Actitud neutral: ni entusiasta ni en contra. |
| **2** | Poca o nula experiencia. Actitud de indiferencia o ligera desconfianza. No ve conexión con su trabajo. |
| **1** | No la usa y tiene resistencia o miedo explícito. Percibe la IA principalmente como amenaza. |
| **0** | Rechazo activo. Expresa que no quiere usarla bajo ninguna circunstancia. |

**Puntaje IA-1:** _______ / 5

---

### IA-2. Uso Práctico de Herramientas de IA (0–5 puntos)

**Ejercicio práctico (5 minutos):**

Entrega al candidato el siguiente enunciado y permítele usar cualquier herramienta de IA de su preferencia (ChatGPT, Gemini, Copilot, Claude, etc.) e ingresar el prompt resultante en el editor integrado de la plataforma:

> "Usando la herramienta de IA que prefieras, pregúntale cómo buscarías en Elasticsearch todos los logs de error del servidor `srv-prod-payments-01` del día de ayer. Cuando tengas la respuesta, explícame si crees que es correcta y por qué."

**Lo que se evalúa no es si la consulta es perfecta, sino:**
1. Si sabe cómo interactuar con una IA para obtener algo útil (cómo formula la pregunta)
2. Si tiene criterio básico para evaluar la respuesta recibida

**Guía de puntuación IA-2:**

| Puntaje | Descripción concreta |
|---|---|
| **5** | Formula una pregunta clara y con contexto. Evalúa la respuesta críticamente: identifica qué es correcto, qué le falta o qué ajustaría. No acepta la respuesta a ciegas. |
| **4** | Formula bien la pregunta y entiende la respuesta, pero la acepta sin cuestionarla o con poca reflexión crítica. |
| **3** | Usa la herramienta pero la pregunta es vaga. La respuesta que obtiene es genérica y no lo nota. |
| **2** | Ha usado IA antes pero le cuesta formular la pregunta en este contexto. Necesita orientación para empezar. |
| **1** | Nunca ha usado una herramienta de IA. Lo intenta pero sin resultado útil. |
| **0** | Se niega a usar la herramienta o no sabe cómo acceder a ninguna. |

**Puntaje IA-2:** _______ / 5

---

### Consolidación Sección IA

| Competencia | Puntaje Obtenido | Máximo |
|---|---|---|
| IA-1. Actitud frente a la IA | | 5 |
| IA-2. Uso práctico | | 5 |
| **Total IA (Complementario)** | | **/10** |

**Interpretación del puntaje IA:**

| Rango | Lectura |
|---|---|
| **8 – 10** | Ya tiene hábitos de uso. Onboarding de IA puede ser acelerado. Candidato diferenciador. |
| **5 – 7** | Base suficiente. El plan de formación debe incluir IA desde el mes 1 con acompañamiento. |
| **0 – 4** | Requiere introducción desde cero. Priorizar en el plan de formación antes de tareas autónomas. |

---

## 8. CONSOLIDACIÓN DE RESULTADOS

### Tabla de Puntaje Final

| Dimensión | Peso | Puntaje Obtenido | Puntaje Ponderado |
|---|---|---|---|
| A. Técnica | 50% | _____ / 50 | _____ |
| B. Habilidades Blandas | 30% | _____ / 30 | _____ |
| C. Actitudinal | 20% | _____ / 20 | _____ |
| **TOTAL** | 100% | | **_____ / 100** |

---

### Escala de Decisión

| Rango | Clasificación | Decisión |
|---|---|---|
| **80 – 100** | 🟢 **Listo para pivotar** | Puede incorporarse al equipo de Delivery con onboarding estándar del CoE |
| **60 – 79** | 🟡 **Pivote con plan de nivelación** | Puede iniciar el pivote, pero requiere un plan de cierre de brechas específico antes del mes 2 |
| **40 – 59** | 🟠 **En preparación** | No está listo aún. Se define un plan de formación de 2–3 meses y se re-evalúa |
| **< 40** | 🔴 **Continúa en su rol actual** | El perfil actual no es compatible con el pivote en esta convocatoria. Se revisa en 6 meses |

---

## 8. FICHA DE EVALUACIÓN INDIVIDUAL

**Nombre del Evaluado:** ___________________________
**Evaluador:** ___________________________
**Fecha:** ___________________________
**Nivel Académico:** ___________________________
**Años de experiencia en NOC / Soporte:** ___________________________
**Turno actual:** ___________________________

| Dimensión | Puntaje |
|---|---|
| A1. Infraestructura y Sistemas | / 15 |
| A2. Observabilidad y Monitoreo | / 15 |
| A3. Herramientas y Automatización | / 10 |
| A4. Pensamiento Analítico | / 10 |
| **Subtotal Técnico** | **/ 50** |
| B1. Comunicación escrita | / 7 |
| B2. Comunicación verbal | / 7 |
| B3. Orientación al cliente | / 4 |
| B4. Trabajo en equipo | / 4 |
| B5. Gestión del tiempo | / 4 |
| B6. Documentación y orden | / 4 |
| **Subtotal Habilidades Blandas** | **/ 30** |
| C1. Aprendizaje autónomo | / 5 |
| C2. Adaptabilidad al cambio | / 5 |
| C3. Aspiraciones de crecimiento | / 5 |
| C4. Tolerancia a la incertidumbre | / 5 |
| **Subtotal Actitudinal** | **/ 20** |
| IA-1. Actitud frente a la IA | / 5 |
| IA-2. Uso práctico | / 5 |
| **IA Complementario** | **/ 10** |
| **PUNTAJE TOTAL** | **/ 100** |

**Clasificación:** 🟢 Listo / 🟡 Con nivelación / 🟠 En preparación / 🔴 Continúa en su rol actual

**Puntaje IA (Complementario):** _______ / 10
**Interpretación IA:** 🔵 Acelerado / 🟣 Con acompañamiento / ⚪ Desde cero

**Fortalezas identificadas:**


**Brechas críticas a cerrar:**


**Recomendación del evaluador:**


**Firma evaluador:** ___________________________

---

## 9. CONSIDERACIONES PARA EL EVALUADOR

- La evaluación **no es un examen de conocimientos teóricos**. Prioriza evidencia de aplicación práctica sobre definiciones memorizadas.
- El candidato **no sabe que está siendo evaluado para un cambio de rol**. Mantén un tono de conversación de desarrollo profesional durante toda la entrevista.
- Las brechas técnicas en observabilidad son **esperadas y normales**. Lo que define el potencial es la base de infraestructura y la actitud.
- Un candidato con puntaje técnico bajo pero actitudinal alto **puede ser más valioso** a largo plazo que uno con alto puntaje técnico y baja disposición al cambio.
- Documenta siempre la evidencia concreta que sustenta cada puntaje asignado.
- Para B1, **revisa tickets reales en GLPI antes de la entrevista** si tienes acceso. Eso te dará contexto real antes del ejercicio escrito.
- Si el evaluador detecta potencial no capturado por el modelo, puede incluir una nota justificada en el campo de recomendación.
