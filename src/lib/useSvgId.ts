import { useId } from 'react';

/**
 * Уникальный id для SVG-градиентов. На вебе одинаковые id у двух экземпляров (например, луна на
 * двух экранах в стеке навигации) ломают отрисовку: браузер берёт градиент из скрытого экрана.
 */
export function useSvgId(name: string) {
  return `${name}-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
}
