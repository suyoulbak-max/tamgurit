# Design System - 플러스 리터러시

## Product Context
- 고등학생과 학부모가 고교학점제, 탐구보고서, 세특, 서류기반면접 준비를 이해하도록 돕는 한국어 교육 정보 사이트입니다.
- 첫인상은 차분하고 신뢰감 있게, 본문은 오래 읽어도 피로하지 않게 설계합니다.

## Aesthetic Direction
- Direction: calm academic guide
- Mood: 입시 사이트처럼 자극적이지 않고, 학교 안내문보다 더 친절한 교육 자료 느낌을 목표로 합니다.
- Decoration: restrained. 색과 그림자, 타이포그래피만으로 위계를 만듭니다.

## Typography
- Body: self-hosted `SUIT Variable`, `Malgun Gothic`, `Apple SD Gothic Neo`, sans-serif. Normal weight 400; supporting copy 500; UI 600–700; headings 800.
- Display: `Paperlogy`, then the body sans-serif stack
- Usage: 히어로와 글 상세 제목에는 로컬 `Paperlogy-8ExtraBold.woff2`를 사용하고, 본문과 UI는 body stack을 사용합니다.
- Scale: small 0.8125rem / label 0.875rem / body 1rem / reading 1.0625rem / card 1.1875rem / section 1.5rem / article title clamp(1.75rem, 3.6vw, 2.625rem) / hero clamp(2rem, 4.6vw, 3.5rem).
- Rhythm: body 1.75; reading paragraphs/lists 1.9; card titles 1.5; display 1.3. Display tracking -0.035em, heading -0.025em, body -0.01em. Korean headings use balanced wrapping, prose uses pretty wrapping.
- Fonts use `font-display: swap`, local assets only; the SUIT variable font is preloaded on generated public pages. Original OFL licence travels with the font.

## Brand primitives
- Brand: 플러스 리터러시 / PLUS LITERACY. The existing descriptive site title remains in metadata and content.
- Mark: original open-book silhouette with a plus at the upper-right; navy book, green plus, paper-white page. Same mark for header, footer and favicon.
- Lockup: 44px square mark, 12px gap, Korean Paperlogy wordmark 1.25rem, English SUIT label 0.625rem with 0.18em tracking; no raster text. On phones the mark is 40px and Korean text 1.125rem.
- Footer lockup uses a 40px mark and navy text on the existing light footer. Images are decorative inside a home link named “플러스 리터러시 홈”. Minimum clear space: 8px; do not stretch or rotate.
- Navigation remains accessible by keyboard with the existing focus-visible ring. Brand text cannot wrap; navigation gets its own scrollable row at 1100px and below, preserving all links.
- Accessibility: body starts at 16px, article copy 17px. Avoid light-weight body text, text clipping, letter-by-letter Korean wrapping and horizontal page overflow. No new motion.
- Accepted scope: no font artwork is invented; typography means font selection, scale, weight, tracking and rhythm. The logo is original SVG; font licences are preserved. No dark theme is introduced.

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
| 2026-10-16 | Plus Literacy book/plus lockup and locally hosted SUIT reading typography | Establish recognizable branding and consistent Korean reading across devices without rebuilding the site |
| 2026-06-06 | Korean education guide typography and palette refined | Improved readability and trust while keeping the static site stable |
| 2026-06-06 | Hero and article title font changed to Paperlogy | Gives the site a more modern education-guide tone than the previous serif title |
| 2026-06-06 | Design shotgun selected Variant A: current direction refined | Keep the navy and teal academic guide direction, improve polish without changing the information structure |
| 2026-06-06 | Final HTML polish added skip link, focus states, reduced-motion and print support | Improves production readiness without changing the approved visual direction |
