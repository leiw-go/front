import { Button, Tooltip } from 'antd';
import type { ReactNode } from 'react';
import { forwardRef } from 'react';

export interface ActionButtonProps {
  /** 悬浮提示文案 */
  title: string;
  /** 图标 */
  icon: ReactNode;
  /** 危险操作（删除）用红色 */
  danger?: boolean;
  onClick?: () => void;
}

/**
 * 操作列里的图标按钮。
 *
 * 统一成「文字型小按钮 + 悬浮提示」，让操作列只占图标宽度，
 * 配合 ProTable 的 fixed: 'right' 固定在最右侧。
 *
 * 用 forwardRef 透传 ref，因为删除按钮外面还包了一层 Popconfirm，
 * Popconfirm 需要拿到真实 DOM 节点来定位气泡。
 */
const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ title, icon, danger, onClick }, ref) => (
    <Tooltip title={title}>
      <Button
        ref={ref}
        type="text"
        size="small"
        danger={danger}
        icon={icon}
        onClick={onClick}
      />
    </Tooltip>
  ),
);

ActionButton.displayName = 'ActionButton';

export default ActionButton;
