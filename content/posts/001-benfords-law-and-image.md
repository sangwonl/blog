---
external: false
draft: false
title: 벤포드법칙(Benford's Law)과 이미지
description: 벤포드 법칙을 활용한 이미지 위변조 탐지 가능성 탐구
date: 2021-03-14
tags: ["수학", "이미지", "탐구"]
---

넷플릭스 <커넥티드 - 수의 법칙> 다큐를 보다가 벤포드의 법칙(Benford's Law)이라는게 있다는걸 알았다.

![Connected](/images/benfords-law/01-connected.png)

**실세계에서 존재하는 많은 수치 데이터의 10진법 값에서 수의 첫째 자리의 확률 분포를 관찰한 결과, 첫째 자리 숫자가 작을 확률이 크다는 법칙이다.** 즉, 자연스럽게(인위적이지 않은) 생긴 임의의 숫자들이 아래와 같은 확률적인 분포를 띈다는 것이다. ([위키](https://en.wikipedia.org/wiki/Benford%27s_law))

![Benford Table](/images/benfords-law/02-benford-table.jpg)

![Benford Graph](/images/benfords-law/03-benford-graph.png)

처음 듣고 보는거라 이놈들이 어디서 또 약을 파나하면서 시청했는데 점점 빠져들었다. 회계에서 비공식적(?)으로 활용되기도 한단다. 가령, 엔론의 회계분식 장부에서는 인위적으로 맞춘듯한 수치들이 있어서 자연스럽지 못해 이 법칙에 어긋난다거나 하는 것들..

IT 분야에서는 이미지의 위조 혹은 딥페이크(Deep Fake) 영상을 탐지하는 연구에도 사용된다는 내용도 나왔는데, 이 부분이 나의 호기심을 자극했다. 그래서 나도 한번 직접 해보기로 했다.

[실험 노트북 전체 보기](https://github.com/sangwonl/labs/blob/main/benford-law/notebook.md)

### 첫번째 나오는 10진수 숫자의 빈도 계산

```python
def calc_benford_stats(np_array):
    first_digits = []
    for x in np.nditer(np_array):
        if x == 0:
            continue

        _, digits, _ = Decimal(abs(float(x))).as_tuple()
        first_digits.append(str(digits[0]))

    total = len(first_digits)
    first_digits_counter = collections.Counter(first_digits)

    total = sum(first_digits_counter.values())
    return sorted(map(lambda t: (int(t[0]), float(t[1]) / total), first_digits_counter.items()))


img = cv2.imread(img_path, cv2.IMREAD_COLOR)

calc_benford_stats(img)
```

### 테스트 #1 여러 색상으로 시도

이미지의 색상을 RGB, Grascale, YCbCr(CrCb) 등의 여러 포맷으로 변경해서 숫자들의 분포를 확인해보았다. 1의 빈도는 높았지만 5부터는 값이 커지는 등 벤포드 그래프와 별로 연관이 없어 보인다. 아마도 셋 모두 0~255 범위의 값이다보니 Variance가 좋지 않아서 그런듯하다.

![Test 1 RGB](/images/benfords-law/04-test1-rgb.png)

![Test 1 YCbCr](/images/benfords-law/05-test1-ycbcr.png)

### 테스트 #2 더 나은 수치 찾기

디지털 이미지의 픽셀 관련해서 좀 더 Variance 가 좋은 수치가 뭐가 있을까 웹서핑을 하다가 JPEG 인코딩 과정 중에 중요한 부분인 DCT(Discrete Cosine Transform) 후의 결과 값이 -1024~1024 라는걸 알았다. 이걸 한번 사용해보면 어떨까. ([코드 참고](https://inst.eecs.berkeley.edu/~ee123/sp16/Sections/JPEG_DCT_Demo.html))

```python
from numpy import r_

import numpy as np
import scipy.fftpack

def to_dct(img):
    def dct2d(a):
        return scipy.fftpack.dct(scipy.fftpack.dct(a, axis=0, norm='ortho'), axis=1, norm='ortho')

    imgsize = img.shape
    dct = np.zeros(imgsize)

    bs = 8
    for i in r_[:imgsize[0]:bs]:
        for j in r_[:imgsize[1]:bs]:
            dct[i:(i+bs),j:(j+bs)] = dct2d(img[i:(i+bs),j:(j+bs)])

    thresh = 0.0
    return dct * (abs(dct) > (thresh*np.max(dct)))

dct = to_dct(img)

calc_benford_stats(dct)
```

DCT의 결과로 다시 뽑아보니 확실히 벤포드 그래프에 가깝게 나왔다.

![Test 2 DCT](/images/benfords-law/06-test2-dct.png)

### 테스트 #3 이미지의 조작 여부를 판단할 수 있는가?

다큐에서 디지털 이미지의 위조를 탐지하는데 사용되기도 한다는 내용이 있었는데 그것도 한번 어떤지 보고 싶었다. 덧칠했거나 품질을 떨어뜨린 이미지들을 준비하고,

![Test 3 Samples](/images/benfords-law/07-test3-samples.png)

원본과 확연한 차이가 있기를 기대하면서 돌려보았다. 그러나 반전이 없는게 반전이었다. 모두 벤포드 그래프에서 크게 벗어나지 않았으며 원본 이미지와의 차이도 확연하진 않았다.

![Test 3 Result](/images/benfords-law/08-test3-result.png)

### 결론

디지털 이미지에서도 벤포드의 법칙이 보였다. 다만, 원본의 위조 여부를 판단하는데 있어서는 쉽게 적용은 어려울 것 같고 (원본과 아주 미세한 차이가 보는걸로 보아) 어느정도 오차에 대한 연구나 데이터가 쌓여서 패턴이 잡힌다면 참고로 활용할 수도 있겠다는 생각이 든다.
