---
external: false
draft: false
title: "삐삐 만들기: 초연결 시대에 단방향 설렘을 되살리다"
description: 90년대 호출기를 스마트폰 앱으로 되살린 개발 회고. 서버리스 아키텍처, LCD UI 재현, 음성 메시지 파이프라인, 그리고 두 번째 바이브 코딩.
date: 2026-02-22
tags: ["바이브코딩", "React Native", "Supabase", "회고"]
---

### 8282, 1004, 486

호출기 세대가 아닌 사람을 위해 설명하자면, 이건 숫자로 보내는 암호다. 8282는 "빨리빨리", 1004는 "천사", 486은 "사랑해". 90년대에는 상대방 호출기에 이런 숫자를 남기고, 공중전화를 찾아 뛰어가서 전화를 걸어야 했다. 비효율의 극치다. 그런데 그 비효율 속에 묘한 설렘이 있었다.

지금은 카톡이 오면 0.1초 만에 확인한다. 읽었는지까지 보인다. 언제나 연결되어 있다. 그런데 이상하게도, 누군가에게 메시지가 왔을 때의 그 두근거림은 사라졌다.

삐삐를 만들어야겠다고 생각한 건 그 지점이었다. 호출기가 실제로 쓸모 있어서가 아니다. **단방향이라서 생기는 설렘**, 번호만 보고 "누구지?" 하고 궁금해하는 그 감정을 다시 만들어보고 싶었다. 호출기를 실제로 써본 적 없는 세대에게도 그 마법 같은 감정을 전할 수 있지 않을까.

### 삐삐?

간단히 말하면 90년대 호출기를 스마트폰 앱으로 재현한 레트로 메신저다. 진짜 호출기처럼 작동한다.

- **나만의 삐삐 번호** — 가입하면 046으로 시작하는 11자리 호출기 번호를 받는다. 뒷자리 4자리는 직접 고를 수 있다
- **공중전화 키패드** — 상대방 삐삐 번호를 누르고, 콜백 번호(내 번호)를 입력해서 보낸다
- **레트로 LCD 화면** — 호출기 LCD에 발신자 번호가 뜬다. 진짜 호출기처럼
- **음성 메시지** — 최대 30초 음성을 녹음해서 함께 보낼 수 있다. 음성 사서함에서 재생
- **푸시 알림** — 삐삐가 오면 알림이 울린다

핵심은 **단방향**이라는 거다. 카톡처럼 대화가 오가는 게 아니라, 번호를 남기는 것뿐이다. 상대방이 누군지 확인하려면 다시 삐삐를 쳐야 한다. 그 불편함이 오히려 재미다.

### 제대로 느껴보는 서버리스

처음 PRD를 쓸 때는 서버를 따로 두려고 했다. Quarkus로 한번 해볼까 싶기도 했다. 그런데 생각해보니 삐삐 앱의 서버 로직은 사실 단순하다. 인증, 데이터 저장, 푸시 알림 발송. 이 정도면 Supabase만으로 충분하지 않을까?

결론부터 말하면, **서버 코드를 한 줄도 작성하지 않고** 서버 역할을 모두 해결했다.

**인증**은 삐삐 번호 + 비밀번호 방식이다. 호출기 앱인데 Google 로그인 화면이 뜨면 분위기가 깨지니까. 가입할 때 번호를 받고 비밀번호를 설정하면, 다음부터는 키패드로 삐삐 번호를 찍고 비밀번호를 입력해서 로그인한다. 로그인 화면 자체가 호출기 UI다. 내부적으로는 Supabase Auth의 이메일 인증을 활용하되, 삐삐 번호를 이메일처럼 매핑해서 쓴다. 회원가입 시 프로필 테이블에 자동으로 행이 생기도록 DB Trigger를 걸었다.

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**호출기 번호 할당**도 DB 함수다. 뒷자리 4자리를 입력하면 중간 4자리를 랜덤으로 배정하는 `assign_pager_number` 함수를 PostgreSQL에 직접 만들었다. 10,000개 후보 중 미사용 조합을 찾아서 배정하는 방식이다.

**메시지 FIFO 삭제**는 DB Trigger로 처리한다. 메시지가 INSERT 되면 트리거가 돌면서 수신자 번호 기준 최신 20개만 남기고 나머지를 자동 삭제한다.

```sql
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM messages
  WHERE id IN (
    SELECT id FROM messages
    WHERE receiver_pager_number = NEW.receiver_pager_number
    ORDER BY created_at DESC
    OFFSET 20
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**푸시 알림**은 Database Webhook + Edge Function 조합이다. `messages` 테이블에 INSERT 이벤트가 발생하면 Supabase가 자동으로 `send-push` Edge Function을 호출한다. 이 함수는 수신자의 푸시 토큰을 조회해서 Expo Push API로 알림을 쏜다.

```typescript
// send-push Edge Function (Deno)
const messages = tokens.map((t) => ({
  to: t.token,
  title: '삐삐!',
  body: record.sender_callback_number,
  data: { messageId: record.id, type: 'new_message' },
  priority: 'high',
}))

await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  body: JSON.stringify(messages),
})
```

메시지가 DB에 들어오면 → Webhook이 Edge Function을 부르면 → 푸시가 나간다. 내가 관리할 서버는 없다.

**RLS(Row Level Security)**도 걸어뒀다. 수신자만 자기 메시지를 조회하고 삭제할 수 있다. 발신은 누구나 가능하지만 조회/삭제는 본인 것만. 이것도 Supabase 정책 한 줄이면 된다.

돌아보면 이 선택이 가장 잘한 결정이었다. 서버를 따로 만들었으면 배포, 모니터링, 스케일링까지 신경 써야 했을 거다. Supabase에 올려놓으니 인프라 걱정 없이 앱 로직에만 집중할 수 있었다.

### 음성 메시지 저장 파이프라인

숫자만 보내는 건 쉽다. 그런데 음성 메시지를 붙이면 갑자기 복잡해진다. 녹음 → 업로드 → 저장 → 재생까지, 생각보다 챙길 게 많았다.

음성 파일 저장소로 Cloudflare R2를 선택했다. 이유는 하나, **egress(다운로드) 비용이 무료**다. 음성 메시지 특성상 여러 번 재생될 수 있는데, 그때마다 다운로드 비용이 나가면 곤란하다.

파이프라인은 이렇게 돌아간다.

1. 앱에서 음성 녹음 (최대 30초, m4a)
2. Supabase Edge Function(`r2-presign`)에 presigned upload URL 요청
3. 받은 URL로 R2에 직접 PUT 업로드
4. DB에 메시지 INSERT (has_voice: true, voice_file_path: "voice/xxx.m4a")
5. 수신 측에서 재생 시 presigned download URL을 받아 스트리밍

```typescript
// 업로드 흐름 (voiceUpload.ts)
const { data: presign } = await supabase.functions.invoke('r2-presign', {
  body: { filePath, action: 'upload', contentType: 'audio/mp4' },
})

const blob = await fetch(localUri).then((r) => r.blob())
await fetch(presign.url, {
  method: 'PUT',
  headers: { 'Content-Type': 'audio/mp4' },
  body: blob,
})
```

핵심은 **앱 → R2 직접 업로드**라는 점이다. Edge Function은 presigned URL만 발급하고, 실제 파일 전송은 앱에서 R2로 직접 간다. Edge Function이 파일을 중계하지 않으니 빠르고 비용도 안 든다.

삭제도 마찬가지. 메시지를 지울 때 DB 레코드와 함께 R2의 음성 파일도 같이 지운다. `r2-delete` Edge Function이 S3 호환 API로 오브젝트를 삭제한다.

### 정감있는 LCD 구현

사실 기능보다 더 신경 쓴 건 UI였다. 호출기 앱인데 호출기처럼 안 생기면 의미가 없다.

LCD 화면 재현이 관건이었다. 실제 호출기 LCD는 단색 액정에 도트 매트릭스로 글자가 표시된다. 그 특유의 연두색 배경에 짙은 녹색 글씨, 약간 번지는 듯한 그림자.

`LCDScreen` 컴포넌트를 만들어서 재사용했다. 연두색(`#9EAD86`) 배경에 짙은 녹색(`#1A1C10`) 글씨, 그리고 `textShadow`로 LCD 특유의 잔상을 표현했다.

```typescript
export const LCD_SHADOW = {
  textShadowColor: 'rgba(26, 28, 16, 0.3)',
  textShadowOffset: { width: 1, height: 1 },
  textShadowRadius: 0,
}
```

`textShadowRadius: 0`이 포인트다. 블러 없이 1픽셀만 옮겨서 찍으면 LCD 도트 매트릭스의 잔상처럼 보인다. 폰트는 모노스페이스(`Courier`/`monospace`)를 써서 숫자가 고정폭으로 정렬되게 했다. 이 정도 디테일이면 "아, 진짜 호출기 같다"는 느낌이 난다.

화면 구성은 위쪽 반이 호출기(LCD), 아래쪽 반이 공중전화 키패드다. 키패드에서 번호를 누르면 호출기 LCD에 표시되고, 메시지를 보내면 상대방 LCD에 내 번호가 뜬다. 이 구조 자체가 90년대 경험의 재현이다.

### 두 번째 바이브 코딩

[이전 글](/posts/vibe-coding-uniconv-ecosystem)에서 uniconv를 바이브 코딩으로 만든 이야기를 쓴 적 있다. 삐삐는 두 번째 바이브 코딩 프로젝트다.

uniconv 때 배운 게 하나 있다면, **디렉션이 가장 중요하다**는 것이다. 에이전트는 코드를 빠르게 만들어내지만, "뭘 만들 건지"는 내가 정해야 한다. 그래서 이번에는 PRD를 먼저 꽤 꼼꼼하게 썼다. 기능 목록, UI 구성, 마일스톤까지 정리한 다음에야 코딩을 시작했다.

이전과 다른 점이 있다면 **기술 스택이 완전히 달랐다**는 것이다. uniconv는 C++, Swift, CMake 세계였고, 삐삐는 React Native, Supabase, Expo 세계다. 언어도 다르고, 플랫폼도 다르고, 아키텍처도 다르다. 그런데 에이전트와의 작업 방식은 거의 동일했다.

"Supabase에서 Google OAuth 설정하려면 어떻게 해?"부터 시작해서, "DB Trigger로 메시지 개수 제한하고 싶어", "Expo Push를 Edge Function에서 쏘고 싶어", "R2에 presigned URL로 업로드하는 구조 잡아줘"까지. 모르는 걸 물어보고, 구조를 논의하고, 코드를 받고, 돌려보고, 피드백하는 사이클.

한 가지 재미있었던 건 Supabase를 처음 쓰면서도 크게 헤매지 않았다는 점이다. RLS 정책이나 Edge Function 배포 같은 건 처음이었는데, 에이전트가 설정 방법과 주의점을 같이 알려주니까 삽질이 줄었다. 물론 Database Webhook 설정은 대시보드에서 직접 해야 했고, 그런 부분은 에이전트가 "이건 수동으로 해야 해"라고 알려줬다.

### 아쉬운 점과 남은 일

완성도 면에서 아쉬운 부분이 있다. 호출기 디바이스 디자인을 더 정교하게 만들고 싶다. 지금은 기능적으로 동작하지만, 실제 호출기의 물성 — 플라스틱 질감, 버튼의 촉감, 안테나 — 을 더 살리고 싶다. 그리고 "호출기 모델"을 여러 개 만들어서 고를 수 있게 하면 재미있을 것 같다.

### 마치며

삐삐를 만들면서 가장 많이 느낀 건, **제약이 곧 디자인**이라는 것이다.

카톡처럼 양방향 채팅을 만들었으면 그냥 또 하나의 메신저가 됐을 거다. 호출기처럼 단방향으로 제한하니까 오히려 독특한 경험이 생겼다. 숫자밖에 못 보내는 제약 덕분에 "8282"나 "1004" 같은 암호 문화가 다시 살아날 수 있다. 30초 음성 제한 덕분에 하고 싶은 말을 압축해야 한다. 그 불편함이 오히려 감성이다.

두 번째 바이브 코딩 프로젝트를 마치면서, 이 방식이 단순히 "빠르게 만드는 방법"이 아니라 "만들어볼 엄두가 나는 방법"이라는 걸 다시 느꼈다. 호출기 앱 같은 건 예전이었으면 "재밌겠는데, 언제 만들지..."로 끝났을 거다. 지금은 생각한 지 며칠 만에 동작하는 앱이 나온다.

궁금하면 한번 구경해보시길. **삐삐 사이트**: [https://retrobeeper.github.io/site](https://retrobeeper.github.io/site)

다음엔 뭘 만들까.
