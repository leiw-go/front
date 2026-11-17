import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const { mockPush, mockOutLogin } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockOutLogin: vi.fn(),
}));

vi.mock('@umijs/max', () => ({
  history: { push: mockPush, replace: vi.fn() },
  useModel: () => ({
    initialState: {
      currentUser: { name: 'admin', roleCode: 'ADMIN' },
    },
    setInitialState: vi.fn(),
  }),
}));

vi.mock('@/services/ant-design-pro/api', () => ({
  outLogin: mockOutLogin,
}));

import { AvatarDropdown } from './AvatarDropdown';

describe('AvatarDropdown', () => {
  it('点击用户名后展开下拉，收起项收敛为 4 个页面入口', async () => {
    render(
      <AvatarDropdown>
        <span>admin</span>
      </AvatarDropdown>,
    );

    fireEvent.click(screen.getByText('admin'));

    await waitFor(() => {
      expect(screen.getByText('用户管理')).toBeInTheDocument();
    });
    expect(screen.getByText('角色管理')).toBeInTheDocument();
    expect(screen.getByText('站内信')).toBeInTheDocument();
    expect(screen.getByText('个人设置')).toBeInTheDocument();
    expect(screen.getByText('退出登录')).toBeInTheDocument();
  });

  it('鼠标从菜单项移回用户名时下拉不消失', async () => {
    render(
      <AvatarDropdown>
        <span>admin</span>
      </AvatarDropdown>,
    );

    const trigger = screen.getByText('admin');
    fireEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('用户管理')).toBeInTheDocument();
    });

    // 模拟鼠标离开触发器（此前 hover 触发会在此把下拉关掉）
    fireEvent.mouseLeave(trigger);
    fireEvent.mouseLeave(screen.getByText('用户管理'));

    expect(screen.getByText('用户管理')).toBeInTheDocument();
    expect(screen.getByText('个人设置')).toBeInTheDocument();
  });

  it('点击菜单项跳转到对应路由并关闭下拉', async () => {
    render(
      <AvatarDropdown>
        <span>admin</span>
      </AvatarDropdown>,
    );

    fireEvent.click(screen.getByText('admin'));

    await waitFor(() => {
      expect(screen.getByText('用户管理')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('用户管理'));

    expect(mockPush).toHaveBeenCalledWith('/account/user-manage');
    // 下拉进入收起动画
    await waitFor(() => {
      expect(document.querySelector('.ant-dropdown')?.className).toContain(
        'ant-slide-up-leave',
      );
    });
  });
});
