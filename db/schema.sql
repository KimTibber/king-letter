-- 확장: UUID 생성용 (gen_random_uuid)
create extension if not exists pgcrypto;

-- Emails 테이블
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  sender_id text not null,
  sender_google_id text,
  recipient_id text,
  -- 수신자의 구글 로그인 식별자(이메일 또는 sub 등)를 저장할 수 있는 필드
  recipient_google_id text,
  subject text,
  body text not null,
  -- 발송일
  created_at timestamptz not null default now(),
  -- 봉인 해제일(열람 가능 시간)
  open_at timestamptz not null,
  -- 템플릿/양식 식별자
  template text not null default 'default',
  read_at timestamptz,
  deleted_at timestamptz
);

-- 선택: RLS 활성화(서비스 롤 키는 우회)
alter table public.emails enable row level security;

-- 필요 시 정책을 추가할 수 있음. (Clerk를 직접 쓰므로 서버에서 서비스 롤로 접근 권장)
-- 예시 정책(참고용):
-- create policy "recipient can read own" on public.emails
--   for select using (recipient_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 마이그레이션: 기존 테이블이 있는 경우 recipient_id의 NOT NULL 제약 해제
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'emails'
      and column_name = 'recipient_id'
  ) then
    begin
      alter table public.emails alter column recipient_id drop not null;
    exception
      when others then null;
    end;
  end if;
end$$;
-- 유효성: 본문은 최소 30자
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'emails_body_min_length'
  ) then
    alter table public.emails
      add constraint emails_body_min_length check (char_length(body) >= 30);
  end if;
end$$;

-- 조회 성능을 위한 인덱스
create index if not exists idx_emails_recipient_created_at on public.emails (recipient_id, created_at);


