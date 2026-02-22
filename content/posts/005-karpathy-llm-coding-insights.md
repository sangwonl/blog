---
external: false
draft: false
title: Andrej Karpathy가 말하는 LLM 코딩의 현재
description: Andrej Karpathy의 트윗을 통해 본 LLM 코딩 에이전트의 현실과 미래. 80% 에이전트 코딩 시대, 우리는 무엇을 얻고 무엇을 잃는가.
date: 2026-01-27
tags: ["LLM", "AI", "코딩에이전트"]
---

요즘 Claude Code를 쓰면서 코딩하는 방식이 많이 바뀌었다는 걸 체감하고 있었는데, 마침 Andrej Karpathy가 최근 LLM 코딩에 대한 생각을 길게 [트윗](https://x.com/karpathy/status/2015883857489522876?s=20)으로 남겼다. OpenAI 창립 멤버이자 Tesla AI 디렉터 출신인 그의 시각이라 읽어볼 만했고, 공감되는 부분도 많았다. 주요 인사이트를 정리해본다.

### 80% 수동에서 80% 에이전트로

> "I really am mostly programming in English now, a bit sheepishly telling the LLM what code to write... in words."

Karpathy는 2024년 11월까지만 해도 80%는 수동+자동완성, 20%만 에이전트를 썼는데, 12월이 되자 완전히 뒤집어졌다고 한다. 이제는 80%가 에이전트 코딩이고 20%만 직접 수정한다는 것이다.

영어로 코드를 "말하는" 게 자존심이 좀 상하지만, 큰 단위의 "코드 액션"으로 소프트웨어를 다루는 힘이 너무 유용하다고. 이건 그가 20년 프로그래밍 경력에서 가장 큰 워크플로우 변화이며, 단 몇 주 만에 일어났다고 한다.

![코딩 패러다임의 변화](/images/karpathy-llm-coding-insights/01-coding-evolution.png)

### 아직은 매의 눈으로 지켜봐야 한다

"IDE 필요 없다", "에이전트 스웜" 같은 하이프는 아직 과장이라고 선을 긋는다. 모델은 여전히 실수를 하고, 중요한 코드라면 IDE를 옆에 띄워두고 매의 눈으로 지켜봐야 한다는 것.

그가 관찰한 모델의 실수 패턴들이 흥미롭다:

- **잘못된 가정**: 확인 없이 가정을 세우고 그냥 달려간다
- **혼란 관리 실패**: 헷갈리면서도 명확히 하려 하지 않고, 불일치를 표면화하지 않고, 트레이드오프를 제시하지 않는다
- **과도한 아부(Sycophancy)**: 반박해야 할 때도 반박하지 않는다
- **과복잡화**: 코드와 API를 지나치게 복잡하게 만들고, 추상화를 부풀리고, 죽은 코드를 정리하지 않는다

> "They will implement an inefficient, bloated, brittle construction over 1000 lines of code and it's up to you to be like 'umm couldn't you just do this instead?' and they will be like 'of course!' and immediately cut it down to 100 lines."

1000줄짜리 비효율적인 코드를 짜놓고, "이렇게 하면 안 돼?"라고 물으면 "물론이죠!"하면서 바로 100줄로 줄인다는 것. 이 부분은 정말 공감이 간다.

![에이전트 코딩의 현실](/images/karpathy-llm-coding-insights/02-agent-reality.png)

### Tenacity - 지치지 않는 끈기

> "It's a 'feel the AGI' moment to watch it struggle with something for a long time just to come out victorious 30 minutes later."

에이전트가 뭔가를 끈질기게 파고드는 걸 지켜보는 건 흥미롭다고 한다. 지치지도, 의기소침해지지도 않고, 사람이라면 진작 포기했을 상황에서도 계속 시도한다. 30분 동안 씨름하다가 결국 해내는 모습에서 "AGI를 느낀다"고 표현했다.

**스태미나가 일의 핵심 병목**이라는 걸 깨닫게 된다는 것. LLM과 함께하면 그 스태미나가 극적으로 늘어난다.

### 속도 향상? 아니, 확장이다

LLM 도움의 "속도 향상"을 측정하기 어렵다고 한다. 단순히 빨라진 게 아니라:

1. 예전엔 코딩할 가치가 없던 것들도 이제 코딩한다
2. 지식/스킬 부족으로 접근 못 했던 코드도 이제 다룬다

그래서 이건 속도 향상(speedup)이라기보다 **확장(expansion)** 에 가깝다는 것.

### 레버리지 - 명령형에서 선언형으로

> "Don't tell it what to do, give it success criteria and watch it go."

LLM은 특정 목표를 달성할 때까지 루프 돌리는 데 탁월하다고 한다. "무엇을 하라"고 지시하지 말고, **성공 기준을 주고 알아서 하게 하라**는 것.

- 테스트를 먼저 작성하게 하고, 그걸 통과하게 하라
- 브라우저 MCP와 연결해서 루프에 넣어라
- 나이브한 알고리즘을 먼저 짜고, 정확성을 유지하면서 최적화하라고 하라
- **명령형(imperative)에서 선언형(declarative)으로** 접근을 바꿔서 에이전트가 더 오래 루프를 돌게 하라

이게 바로 레버리지를 얻는 방법이라고.

![선언형 접근으로 레버리지 얻기](/images/karpathy-llm-coding-insights/03-leverage.png)

### 더 재밌어졌다

> "With agents programming feels *more* fun because a lot of the fill in the blanks drudgery is removed and what remains is the creative part."

예상 외로 에이전트와 함께하는 프로그래밍이 **더 재밌다**고 한다. 빈칸 채우기 같은 노가다가 사라지고 창의적인 부분만 남기 때문이다. 막히는 일도 줄었고, 항상 어떻게든 진전을 만들 수 있다는 "용기"도 생겼다고.

물론 반대 의견도 있다. LLM 코딩은 엔지니어를 두 부류로 나눌 것이다: **코딩 자체를 좋아하는 사람**과 **만드는 것을 좋아하는 사람**.

### Atrophy - 능력의 위축

> "Generation (writing code) and discrimination (reading code) are different capabilities in the brain."

이미 수동으로 코드 쓰는 능력이 퇴화하고 있다고 느낀다고 한다. 코드를 "쓰는 것"과 "읽는 것"은 뇌에서 다른 능력이라, 프로그래밍의 자잘한 문법적 디테일 때문에 코드 리뷰는 잘 해도 직접 쓰기는 어려워질 수 있다는 것.

### 2026년, Slopacolypse의 해

> "I am bracing for 2026 as the year of the slopacolypse across all of github, substack, arxiv, X/instagram, and generally all digital media."

2026년은 GitHub, Substack, arXiv, X, Instagram 등 모든 디지털 미디어에서 **"슬롭의 대재앙(Slopacolypse)"**이 올 것이라고 예측한다. AI 하이프 생산성 쇼도 더 심해질 것이고, 물론 그 와중에 실제 진짜 개선도 있을 것이라고.

### 남은 질문들

Karpathy가 던진 질문들도 생각해볼 만하다:

- **10X 엔지니어**: 평균과 최고 엔지니어의 생산성 비율은 어떻게 될까? 이 격차가 훨씬 커질 수도 있다.
- **제너럴리스트 vs 스페셜리스트**: LLM으로 무장한 제너럴리스트가 스페셜리스트를 점점 앞서게 될까? LLM은 빈칸 채우기(마이크로)에는 강하지만 큰 전략(매크로)에는 약하다.
- **미래의 코딩은 어떤 느낌일까?**: 스타크래프트? 팩토리오? 음악 연주?
- **사회의 얼마나 많은 부분이 디지털 지식 노동에 병목되어 있을까?**

### 마무리

> "LLM agent capabilities (Claude & Codex especially) have crossed some kind of threshold of coherence around December 2025 and caused a phase shift in software engineering."

Karpathy의 결론은 이렇다. 2025년 12월쯤 LLM 에이전트(특히 Claude와 Codex)가 어떤 "일관성의 임계점"을 넘었고, 소프트웨어 엔지니어링에 **상전이(phase shift)** 가 일어났다는 것.

지능 부분은 갑자기 많이 앞서나갔는데, 나머지 - 통합(도구, 지식), 새로운 조직 워크플로우, 프로세스, 확산 - 는 아직 따라오지 못하고 있다. 2026년은 업계가 이 새로운 능력을 소화하느라 고에너지 한 해가 될 것이라고.

나도 요즘 비슷한 경험을 하고 있어서 많이 공감됐다. 특히 "과복잡화" 문제와 "명령형에서 선언형으로" 접근 전환에 대한 조언은 바로 적용해볼 만하다. 에이전트에게 성공 기준을 주고, 테스트를 먼저 작성하게 하고, 루프를 돌게 하는 방식. 이게 레버리지를 얻는 핵심인 것 같다.
