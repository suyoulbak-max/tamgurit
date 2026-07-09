# Design System - 고교학점제 탐구가이드

## Product Context
- 고등학생과 학부모가 고교학점제, 탐구보고서, 세특, 서류기반면접 준비를 이해하도록 돕는 한국어 교육 정보 사이트입니다.
- 첫인상은 차분하고 신뢰감 있게, 본문은 오래 읽어도 피로하지 않게 설계합니다.

## Aesthetic Direction
- Direction: calm academic guide
- Mood: 입시 사이트처럼 자극적이지 않고, 학교 안내문보다 더 친절한 교육 자료 느낌을 목표로 합니다.
- Decoration: restrained. 색과 그림자, 타이포그래피만으로 위계를 만듭니다.

## Typography
- Body: `Pretendard Variable`, `Pretendard`, `SUIT Variable`, `Noto Sans KR`, `Malgun Gothic`, `Apple SD Gothic Neo`, sans-serif
- Display: `Paperlogy`, then the body sans-serif stack
- Usage: 히어로와 글 상세 제목에는 로컬 `Paperlogy-8ExtraBold.woff2`를 사용하고, 본문과 UI는 body stack을 사용합니다.

## Color
- Primary: `#20395f` - 신뢰, 학습, 구조화된 정보
- Accent: `#12785f` - 성장, 탐구, 긍정적 진행
- Background: `#f5f7f4` - 흰색보다 부드러운 학습지 느낌
- Paper: `#fbfaf7` - CTA와 정보 섹션 배경
- Line: `#dce4df` - 카드와 문서 경계

## Layout
- Max width: `1160px`
- Radius: `8px`
- Cards: 얕은 border와 soft shadow를 사용하고, hover에서 3px 정도만 떠오릅니다.
- Footer: 문의 CTA 후 `사이트 / 정보` 구조를 유지합니다.

## Motion
- Minimal functional motion only.
- Hover transition: 160-180ms.
- No decorative animated background or heavy motion.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-06-06 | Korean education guide typography and palette refined | Improved readability and trust while keeping the static site stable |
| 2026-06-06 | Hero and article title font changed to Paperlogy | Gives the site a more modern education-guide tone than the previous serif title |
| 2026-06-06 | Design shotgun selected Variant A: current direction refined | Keep the navy and teal academic guide direction, improve polish without changing the information structure |
| 2026-06-06 | Final HTML polish added skip link, focus states, reduced-motion and print support | Improves production readiness without changing the approved visual direction |
