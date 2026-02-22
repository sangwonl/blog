---
external: false
draft: false
title: 배경 제거(일명 누끼따기) 실험
description: rembg와 U2-Net을 활용한 이미지 배경 제거 실험
date: 2021-03-28
tags: ["이미지처리", "딥러닝", "실험"]
---

## 배경

반디캠으로 스크린 레코딩을 하다가 캠이랑 합성을 해주는 기능이 있다는 걸 발견. 그런데 이게 내 뒤에 크로마키로 쓸만한 배경이 없다보니 대충 배경으로 쓸만한 색 잡아서 쓰니까 대충 깨져보이더라.

![크로마키 실패](/images/rembg-test/01-chromakey-fail.jpg)

그래서 혹시 전통적인 크로마키 배경 방식이 아니라 인물(사물)을 detection 하고 그 외의 것을 날려버리는 툴은 없을까 찾아봤다. 왜 없겠냐? 실망스럽게도 이미 잘나가는게 많더라. 그중에서도 뭔가 잘 동작할 것 처럼 보이는 오픈소스([danielgatis/rembg](https://github.com/danielgatis/rembg))를 하나 찾아서 이걸로 테스트를 해보려고 한다.

## rembg

[U2-Net](https://arxiv.org/pdf/2005.09007.pdf)이라는 Object Detection을 위한 딥러닝 모델(딥러닝은 하나도 모르지만..)을 이용해서 배경 이미지를 날리고 테투리 알파(Alpha) 부분을 다듬어서 깔끔하게 배경을 날려주는 도구라고 한다.

![U2-Net](/images/rembg-test/02-u2net.jpg)

## 테스트 코드

```python
import time
import io
import numpy as np
import matplotlib.pyplot as plt

from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

from rembg.bg import remove as remove_bg

def show_rembg(path):
    fig = plt.figure(figsize=(10, 10))

    # show original image
    fig.add_subplot(1, 2, 1)
    orig_img = Image.open(path)
    plt.imshow(orig_img)

    # show bg removed image
    fig.add_subplot(1, 2, 2)
    f = np.fromfile(path)

    started = time.time()
    result = remove_bg(f)
    elapsed = time.time() - started
    print(f'it takes {elapsed} seconds for removing bg.')

    img = Image.open(io.BytesIO(result)).convert("RGBA")
    plt.imshow(img)

# Usage
show_rembg('res/car.jpg')
```

it takes 1.6791925430297852 seconds for removing bg.

![차량 배경 제거 결과](/images/rembg-test/03-car-result.png)

## 여러 테스트

인물, 사물, 배경, 풍경, 만화 캐릭, 밝기나 선명도에 따라 어떤 결과를 보여줄지 해상도에 따라 어떤 (시간)성능 차이가 있는지 등을 짧게 테스트해보았다. 자세한 내용은 [여기서 확인](https://github.com/sangwonl/labs/blob/main/rembg-test/notebook.md#%EC%97%AC%EB%9F%AC-%EC%83%81%ED%99%A9%EC%97%90-%EB%8C%80%ED%95%9C-%ED%85%8C%EC%8A%A4%ED%8A%B8)하실 수 있습니다.

## 소감

몇가지 자잘한 테스트를 해본 것으로 rembg나 그 기반이 되는 U2-Net 모델의 성능 등에 대해서 뭔가 결론을 낼 수는 없을 것 같다. 심지어 내가 잘 모르는 영역이기도 하고해서 그냥 간단히 써본 소감만 적어보고자 한다.

> - 일단 사진을 돌리면서 내가 의도한 부분을 얼추 처리해주는 것 같아서 신기하다.
>
> - 퀄리티는 경계 부분이 얼마나 또렷한지 왠지 학습되었을 것 같은 대상이냐에 따라 다른 것 같다. (풍경은 특히 어려운 듯)
>
> - 완전히 맡기기보다 1차적인 윤곽을 잡아주는 등 유저와 인터랙션하면서 협업하는데 사용하면 훨씬 유용할 것 같다.
>
> - 해상도가 작을수록 처리시간이 덜 걸리는건 맞으나 드라마틱하게 떨어지진 않는 것 같다. 그래서 이걸 그대로 프레임마다 실시간으로 쓰기에는 무리인 것 같다. (이쪽을 잘 몰라서 최적화가 가능한지 모르겠다.)
