# Фаза 12 — Accessibility baseline

- після SPA-навігації сторінка прокручується вгору, focus переходить на `main`, а screen reader отримує назву нового `h1` через live region;
- глобальний `:focus-visible` має контрастну двопіксельну рамку;
- `prefers-reduced-motion: reduce` вимикає довгі animation/transition і smooth scroll;
- горизонтальні media rows мають стабільні унікальні `aria-labelledby`, назву scroll region і клавіатурний focus;
- progress bar передає числове значення і текстовий відсоток;
- помилки полів пов’язані через `aria-describedby`, `aria-invalid` і live region;
- непрочитані сповіщення позначаються не лише кольором, а й прихованим текстом;
- unit-тести контролюють form semantics, progress semantics та WCAG AA contrast основних пар обох тем.

Наступний крок: ручний screen-reader/keyboard smoke-test і Lighthouse/performance audit.
