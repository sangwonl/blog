---
external: false
draft: false
title: ChatGPT와 함께 강화학습 기본 따라하기
description: 강화학습은 매우 간단한 예제는 뭐가 있고, 어떤 라이브러리가 사용되는지 가볍게 엿볼 수 있는 정도의 글입니다.
date: 2025-04-13
tags: ["강화학습", "AI", "ChatGPT"]
---

\* 이 글은 강화학습에 대해 설명하는 글이나 단계적으로 설명하는 튜토리얼도 아닙니다. 강화학습은 매우 간단한 예제는 뭐가 있고, 어떤 라이브러리가 사용되는지 가볍게 엿볼 수 있는 정도의 글입니다.

### 시작

어제 아침에 하천을 따라 달리기를 하다가 물에서 파닥거리는거에 시선을 뺏겨 잠시 멈춰섰다. 처음엔 그냥 돌 주변의 물보라인가 아니면 오리가 잠수를 한건가 했는데 자세히 보니 연어가 파닥거리는거였다. 중간 중간 징검다리 같은 단차도 있었을텐데 여기까지 어떻게 왔을까? 연어야 뭐 산란기에 강을 거슬러 올라간다고 하지만 그게 저토록 애써서 모든 힘를 쏟아부을만큼 중요한건가? 하는 생각이 문득 들었다.

생존에 유리한게 있겠지하면서도 뭔가 더 있을까해서 ChatGPT 한테 물어보기로 했다.

![ChatGPT에게 연어에 대해 물어보기](/images/reinforcement-learning-chatgpt/01-salmon-chatgpt.png)

상류로 갈수록 차고, 맑고, 산소 풍부하고, 천적도 적고 등은 물리적인 이유라치고 '나도 이 강에서 컸으니까 내 새끼들도 여기서 잘 자랄 거야!' 이부분이 참 와닿았다. 사람도 자기가 커왔고 배워오고 해온 것들이 맞다고 편향되지 않던가. 참 직관적인 해설이어서 마음에 들었다.

![연어의 귀소본능 이유](/images/reinforcement-learning-chatgpt/02-salmon-reason.png)

그런데 요즘 ChatGPT 가 나를 학습해서 그런지 '귀소성'이라는 키워드에 기술관련된 부분이 궁금할지 역으로 제안한다. 하릴없이 나는 질문에 걸려들었고 주제를 틀어 계속 대화를 이어가봤다.

![ChatGPT의 기술 주제 제안](/images/reinforcement-learning-chatgpt/03-chatgpt-suggestion.png)

여러 AI 관련 주제를 던져줬는데 다 하나도 모르지만 그나마 들어본게 강화학습이라 이쪽으로 좀 더 물어보다보니..

![ChatGPT의 환경 설정 안내](/images/reinforcement-learning-chatgpt/04-chatgpt-setup.png)

이미 Python 가상환경을 설치하는 단계에 진입했다. 이건 뭐 내가 학습하고 싶은건지 ChatGPT 가 본인이 아이디어가 있는데 손발이 필요해서 나를 부려먹는건지 참 구분하기 애매한 지점이라는 생각이 들었다. 한편, 나를 학습한 LLM 의 모범적인 모습이라는 생각에 근미래가 기대되면서도 조금은 두려웠다.

어쨌든 이제부터 ChatGPT 가 알려준대로 코드를 따라해보면서 조금이라도 배워보자. (사실 한번에 실행 가능한 버전이 나오진 않았고 몇 차례 핑퐁은 했지만 일단 이쪽 도메인에 지식이 전무해서 직접 코드를 수정하진 않았다. 다 VSCode Copilot Agent 를 시켜서 작업)

하고자하는건, MxM Grid 에서 어떤 오브젝트가 시작점(1,1)에서 목표지점(M,M) 을 찍고 다시 시작점으로 돌아오는 걸 학습하는 것이다. (5x5 그리드 기준, 20 스텝 안에 들어오기)

### 강화학습 대상(봇, 환경) 구성

```python
import gymnasium as gym
from gymnasium import spaces

from stable_baselines3 import PPO
from stable_baselines3.common.env_checker import check_env
import numpy as np
import os

# Constants
GRID_SIZE = 5
CELL_SIZE = 100
FPS = 4

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)

# Actions
LEFT = 0
RIGHT = 1
UP = 2
DOWN = 3

# Phase
PHASE_GO = 'go'
PHASE_RETURN = 'return'

# Rewards
STEP_REWARD = -1
GOAL_REWARD = 10
RETURN_REWARD = 20

class HomeMazeEnv(gym.Env):
    def __init__(self, grid_size=GRID_SIZE):
        super(HomeMazeEnv, self).__init__()
        self.grid_size = grid_size
        self.start_pos = (0, 0)
        self.goal_pos = (grid_size - 1, grid_size - 1)
        self.current_pos = self.start_pos
        self.phase = PHASE_GO

        self.action_space = spaces.Discrete(4)
        self.observation_space = spaces.Box(
            low=np.array([0, 0], dtype=np.int32),
            high=np.array([grid_size - 1, grid_size - 1], dtype=np.int32),
            dtype=np.int32)

    def reset(self, *, seed=None, options=None):
        super().reset(seed=seed)
        self.current_pos = self.start_pos
        self.phase = PHASE_GO
        return np.array(self.current_pos, dtype=np.int32), {}

    def step(self, action):
        x, y = self.current_pos
        if action == LEFT: x = max(0, x - 1)
        elif action == RIGHT: x = min(self.grid_size - 1, x + 1)
        elif action == UP: y = max(0, y - 1)
        elif action == DOWN: y = min(self.grid_size - 1, y + 1)
        self.current_pos = (x, y)

        terminated = False
        truncated = False
        reward = STEP_REWARD

        if self.phase == PHASE_GO and self.current_pos == self.goal_pos:
            self.phase = PHASE_RETURN
            reward = GOAL_REWARD
        elif self.phase == PHASE_RETURN and self.current_pos == self.start_pos:
            reward = RETURN_REWARD
            terminated = True

        return np.array(self.current_pos, dtype=np.int32), reward, terminated, truncated, {}

    def render(self):
        pass

    def close(self):
        pass


def train():
    # 모델을 저장할 디렉토리 생성
    models_dir = "models"
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)

    env = HomeMazeEnv(grid_size=GRID_SIZE)
    check_env(env)

    model = PPO("MlpPolicy", env, verbose=1)
    model.learn(total_timesteps=50000)

    # 학습된 모델 저장
    model_path = os.path.join(models_dir, "ppo_maze")
    model.save(model_path)
    print(f"Model saved to {model_path}.zip")

    # 모델 로드 테스트 (선택사항)
    loaded_model = PPO.load(model_path)
    print("Model loaded successfully!")


if __name__ == '__main__':
    train()
```

우선, gymnasium 이라는 모듈의 Env 를 만드는 것으로 시작한다. stable_baselines3 이라는 강화학습 모듈이 학습을 시도할때 사용되는 환경이라고 한다. 포인트는 아래와 같은 것들이 있다. (그리고 유저가 gym Env 에 필요한 것들을 제대로 구현했는지는 stable_baselines3.common.env_checker 가 검증해주니 그 가이드를 따라가면 됨)

*observation_space*

observation_space는 강화학습 환경에서 에이전트가 관찰할 수 있는 상태(state)의 범위를 정의합니다. 여기서는 spaces.Box를 사용하여 2차원 좌표 공간을 정의하고 있으며:

- low: 관찰 가능한 최소값 (0,0)
- high: 관찰 가능한 최대값 (grid_size-1, grid_size-1)
- dtype: 데이터 타입은 정수형(np.int32)

즉, 에이전트가 미로에서 자신의 위치를 (x,y) 좌표로 관찰할 수 있는 범위를 지정하는 것으로 gym 환경에서는 이 정보를 통해 에이전트가 받는 관찰값의 형태와 범위를 인지함

*action_space*

action_space는 강화학습 환경에서 에이전트가 취할 수 있는 행동(액션)의 공간을 정의. 여기서 spaces.Discrete(4)는 0부터 3까지의 4개 정수 값(LEFT=0, RIGHT=1, UP=2, DOWN=3)을 가진 이산적인 행동 공간을 의미한다고 함. 이것은 gym 라이브러리에서 에이전트가 어떤 종류의 행동을 할 수 있는지 명시하는 필수 속성

*step()*

step() 에서는 실제 움직임을 조작하고, 그 결과에 대한 피드백(리워드)를 반환하는 함수로 가장 중요한 요소임. 위 구현을 보니 현재 이동 상태를 두 단계(go, return)로 두고, go 단계에서는 목표지점에 도작했는지 확인하며, return 단계에서는 다시 시작점인지 확인함. go 단계를 성공하면 10 점을 주고 return 단계를 성공하면 20점을 줌

목표지점을 가는데도 보상으로 동기부여를 하지만, 다시 돌아오는 것 까지 하면 더 많은 보상을 주는 것으로 기대 행동을 훈련시키고자 함

### 학습

stable_baselines3.PPO 를 통해 위에서 정의한 환경을 넘겨주며 훈련시간(total_timesteps)을 지정해주면 열심히 수행하고 모델이 만들어진다. 이걸 나중에 사용할 수 있게 models/ppo_maze.zip 으로 저장한다. CPU 로도 충분히 학습할 수 있으니 한번 따라해봐도 좋습니다. 오히려 GPU를 써도 별로 utilization 이 안좋으니 CPU 를 쓰라는 안내가 뜨기도 함.

### 모델 적용 및 실행

모델이 적용되어 그리드를 잘 헤치고 목표지점까지 갔다가 잘 돌아오는지 확인하는 걸 시각화했으면 좋을 것 같아 pygame 을 이용해 간단한 GUI 를 구현해보았다.

```python
import pygame

class HomeMazeGameEnv:
    def __init__(self, grid_size=GRID_SIZE, cell_size=CELL_SIZE):
        self.grid_size = grid_size
        self.cell_size = cell_size
        self.window_size = grid_size * cell_size

        self.start_pos = (0, 0)
        self.goal_pos = (grid_size - 1, grid_size - 1)
        self.current_pos = self.start_pos
        self.phase = 'go'

        pygame.init()
        pygame.display.init()
        self.window = pygame.display.set_mode((self.window_size, self.window_size))
        self.clock = pygame.time.Clock()

    def _create_grid_surface(self):
        surface = pygame.Surface((self.window_size, self.window_size))
        surface.fill(WHITE)

        # Draw grid lines
        for i in range(self.grid_size + 1):
            pygame.draw.line(surface, BLACK, (i * self.cell_size, 0),
                            (i * self.cell_size, self.window_size), 2)
            pygame.draw.line(surface, BLACK, (0, i * self.cell_size),
                            (self.window_size, i * self.cell_size), 2)
        return surface

    def _draw_position(self, surface, pos, color, is_circle=False):
        x, y = pos
        if is_circle:
            pygame.draw.circle(
                surface,
                color,
                (x * self.cell_size + self.cell_size // 2,
                 y * self.cell_size + self.cell_size // 2),
                self.cell_size // 3
            )
        else:
            pygame.draw.rect(
                surface,
                color,
                pygame.Rect(
                    x * self.cell_size,
                    y * self.cell_size,
                    self.cell_size,
                    self.cell_size
                )
            )

    def reset(self):
        self.current_pos = self.start_pos
        self.phase = 'go'
        self._render_frame()

    def step(self, action):
        x, y = self.current_pos
        if action == LEFT: x = max(0, x - 1)
        elif action == RIGHT: x = min(self.grid_size - 1, x + 1)
        elif action == UP: y = max(0, y - 1)
        elif action == DOWN: y = min(self.grid_size - 1, y + 1)
        self.current_pos = (x, y)

        done = False

        if self.phase == 'go' and self.current_pos == self.goal_pos:
            self.phase = 'return'
        elif self.phase == 'return' and self.current_pos == self.start_pos:
            done = True

        self._render_frame()
        return done

    def _render_frame(self):
        # Create base grid
        canvas = self._create_grid_surface()

        # Draw positions
        self._draw_position(canvas, self.start_pos, GREEN)
        self._draw_position(canvas, self.goal_pos, RED)
        self._draw_position(canvas, self.current_pos, BLUE, is_circle=True)

        self.window.blit(canvas, canvas.get_rect())
        pygame.event.pump()
        pygame.display.flip()
        self.clock.tick(FPS)

    def close(self):
        if self.window is not None:
            pygame.display.quit()
            pygame.quit()

SUCCESS_STEPS = 20

def do_mission():
    env = HomeMazeGameEnv()
    model = PPO.load("models/ppo_maze")

    env.reset()
    for _ in range(SUCCESS_STEPS):
        obs = np.array(env.current_pos, dtype=np.int32)
        action, _states = model.predict(obs)
        terminated = env.step(action)
        if terminated:
            print("귀소 성공!")
            break
    else:
        print("귀소 실패!")
    env.close()


if __name__ == '__main__':
    do_mission()
```

HomeMazeGameEnv 는 HomeMazeEnv 와 다르게, 모델을 이용하기만 하는거라 gym Env 가 필요하진 않다. 대신 action 을 수행하는 step() 과 현재 상태를 시각화할 수 있는 render() 만 있으면 된다. pygame 을 이용한 render 부분은 크게 중요한게 아니니 스킵하고 step() 을 보면 학습할때와 동일하게 action 에 맞는 이동을 수행하면 되고, 피드백(보상)은 필요하지 않다.

그래서 돌려보면.. **실패**

{% video src="/images/reinforcement-learning-chatgpt/05-timestep-50k.mp4" /%}

5만 timesteps 으로는 아직 정신을 못 차리는 듯하다. 그래서 10만 정도로 다시 해봤더니,

{% video src="/images/reinforcement-learning-chatgpt/06-timestep-100k.mp4" /%}

오, 됐다... 싶었는데 여전히 헤매고 있었다. 그래서 통크게 20만 timesteps 로 올려서 학습해봤더니,

{% video src="/images/reinforcement-learning-chatgpt/07-timestep-200k.mp4" /%}

드디어 "귀소 성공"

### 생각

- 연어로 시작된 궁금함이 ChatGPT 덕에 또 다른 배움으로 이어질 수 있었다.
- 강화학습이라는걸 말로만 들어봤지 헬로월드 하나 해본적 없었는데 이번 기회에 기초 중에 기초라도 따라해봐서 좋았다.
- 이걸 실제 게임과 연결해보는 방법은 어떻게 하는건지 나중에 좀 더 이어가보면 좋을 것 같다.
- ChatGPT 와 Copilot Agent 덕에 정말 큰 시간 절약과 학습 효율 관점의 이득을 체감해볼 수 있었다.
- 여러 카테고리에 다양한 알고리즘이 있는 것 같은데 각각의 특징들에 대해서 시간내서 한번씩은 봐둬야할 것 같다.

#### 관련 자료

- 위 코드는 jupyter notebook 으로 실행했고 관련 코드는 [여기](https://github.com/sangwonl/labs/blob/main/play-with-gpt-maze/maze.ipynb)에서 확인할 수 있음
- 실제 게임과 통합 관련해서는 [openai/retro](https://github.com/openai/retro) 라는게 있는데 고전 게임들에 강화학습을 붙여볼 수 있는 툴킷임
