---
external: false
draft: false
title: "10년 묵은 집밥 레시피 앱, AI로 되살리다"
description: AngularJS 1 + Ionic v1으로 만든 아내의 레시피 앱을 Claude Code로 Angular 20 + Ionic 8으로 리뉴얼한 이야기
date: 2026-02-22
tags: ["바이브코딩", "AI", "모바일앱", "Ionic", "Angular"]
---

### 아내의 레시피 앱

약 10년 전, 아내가 요리 레시피를 모아두고 싶다고 했다. 개발자인 남편으로서 당연히 "앱 하나 만들어줄까?"가 나왔고, 그렇게 **집밥 레시피 앱**이 태어났다. Ionic v1과 AngularJS 1으로. 그때는 그게 최선이었다.

아내는 열심히 레시피를 모았다. 밥/죽/스프, 탕/찌개/국, 면요리, 반찬, 별미요리, 양념/소스, 간식/디저트, 음료까지 8개 카테고리에 수백 개의 레시피가 쌓였다. 요리 이름, 재료, 조리 순서, 요리 동영상 링크까지 꼼꼼하게.

그런데 시간이 흘렀다. AngularJS 1은 공식 지원이 끝난 지 오래고, Ionic v1도 마찬가지. 요리 동영상 링크는 하나둘 깨져나갔다. 스토어에서도 더 이상 빌드가 안 됐다. 앱은 조용히 죽어갔고, 나는 유지보수할 엄두가 나지 않았다. 프레임워크를 통째로 바꿔야 하는 건 "고치는" 수준이 아니라 "다시 만드는" 수준이니까.

그렇게 몇 년을 방치했다.

### 유물 발굴

최근 AI 코딩 에이전트들이 좋아지면서, 문득 이 앱이 떠올랐다. "혹시 이걸로 되살릴 수 있지 않을까?"

오랜만에 레거시 코드를 열어봤다. 진짜 유물이었다.

```javascript
angular.module('starter', [
  'ionic',
  'ngIOS9UIWebViewPatch',
  'ui.bootstrap',
  'starter.services',
  'starter.controllers'
])
```

`ngIOS9UIWebViewPatch`라니. iOS 9 시절의 웹뷰 패치가 아직 남아있다. Bower로 의존성을 관리하고, Gulp로 빌드하던 시절의 코드.

컨트롤러 코드도 지금 보면 격세지감이다.

```javascript
.controller('RecipeDetailCtrl', function(
  $scope, $stateParams, $sce, $localStorage,
  $http, $ionicHistory, Channel, Recipe, Favorite
) {
  $scope.toggleFavorite = function() {
    var recipeId = $scope.recipe.id;
    if (Favorite.exist(recipeId)) {
      Favorite.remove(recipeId);
    } else {
      Favorite.add(recipeId);
    }
  };

  // ...중략...

  // AdMob 광고 (5회 노출마다 90% 확률로)
  if (isAdMobAvailable && numExposed % 5 == 0 && probability < 90) {
    window.plugins.AdMob.createInterstitialView({ ... });
  }
})
```

`$scope`, `$sce.trustAsResourceUrl`, `window.plugins.AdMob`... 2015년의 나와 재회하는 느낌이었다. Google URL Shortener API 키가 코드에 하드코딩되어 있는 것도 발견했다 (물론 그 API는 이미 서비스 종료).

### "프레임워크 최신화하고 디자인 다듬어줘"

Claude Code에게 건넨 첫 프롬프트가 거의 이게 전부였다. 물론 그 뒤로 디테일한 후속 디렉션이 따르긴 했지만, 핵심 지시는 이 한 줄이었다.

결과는 놀라웠다. 에이전트는 AngularJS 1 코드를 분석하고, 데이터 구조를 파악하고, Angular 20 + Ionic 8 + Capacitor 7 기반으로 전체 앱을 재구성했다. `$scope`와 콜백 지옥이 Observable과 타입 안전한 서비스로 바뀌었다.

기존의 콜백 기반 서비스 호출이:

```javascript
Recipe.allByCategory($scope.category.code, function(recipe) {
  $scope.recipes = recipe;
  CtrlCommons.embedChannelHint($scope.recipes);
});
```

이렇게 바뀌었다:

```typescript
@Injectable({ providedIn: 'root' })
export class DataService {
  private recipesSubject = new BehaviorSubject<Recipe[]>([]);
  public recipes$ = this.recipesSubject.asObservable();

  getRecipesByCategory(categoryCode: number): Observable<Recipe[]> {
    return this.recipes$.pipe(
      map(recipes => recipes.filter(
        recipe => recipe.categoryCode === categoryCode
      ))
    );
  }

  searchRecipes(keyword: string): Observable<Recipe[]> {
    return this.recipes$.pipe(
      map(recipes => recipes.filter(recipe =>
        recipe.name.toLowerCase().includes(keyword.toLowerCase()) ||
        recipe.ingredients.some(i =>
          i.toLowerCase().includes(keyword.toLowerCase())
        )
      ))
    );
  }
}
```

### 기술 스택의 10년

변화의 폭을 정리하면 이렇다.

| 항목 | Before (2015) | After (2025) |
|------|---------------|--------------|
| **프레임워크** | AngularJS 1.x | Angular 20 |
| **UI 프레임워크** | Ionic v1 | Ionic 8 |
| **언어** | JavaScript (ES5) | TypeScript 5.8 (strict) |
| **모바일 런타임** | Cordova | Capacitor 7 |
| **빌드 도구** | Gulp + Bower | Angular CLI + npm |
| **컴포넌트 구조** | Controller + $scope | Standalone Components |
| **상태 관리** | $scope 바인딩 | BehaviorSubject + Observable |
| **패키지 관리** | Bower | npm |
| **타입 시스템** | 없음 | TypeScript strict mode |

10년 사이 프론트엔드 생태계가 얼마나 바뀌었는지 한눈에 보인다. AngularJS에서 Angular로의 전환은 단순 버전업이 아니라 완전히 다른 프레임워크로의 이주다. 이걸 사람 손으로 하려면... 솔직히 안 했을 것이다.

### 앱 부트스트랩의 변화

옛날 코드의 앱 초기화는 이랬다:

```javascript
angular.module('starter', ['ionic', 'ngIOS9UIWebViewPatch', ...])
.run(function($ionicPlatform, $state, $ionicHistory, $ionicPopup, AppInfo) {
  $ionicPlatform.ready(function() {
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      StatusBar.styleLightContent();
    }
    window.analytics.startTrackerWithId('UA-34431301-10');
  });
})
```

지금은 이렇다:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular/standalone';

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ animated: true, rippleEffect: true }),
    provideHttpClient(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});
```

`window.cordova`를 직접 건드리던 코드가 Capacitor의 깔끔한 플러그인 API로 대체됐다. `window.plugins.AdMob`을 직접 호출하던 방식도, `$sce.trustAsResourceUrl`로 URL을 신뢰 처리하던 방식도 모두 사라졌다.

### 데이터는 살아있었다

다행히 레시피 데이터 자체는 JSON 파일로 잘 보존되어 있었다. 8개 카테고리, 수백 개의 레시피. 아내가 하나하나 정리했던 재료 목록과 조리 순서가 고스란히 남아있었다.

```typescript
export interface Recipe {
  id: number;
  name: string;
  categoryCode: number;
  mediaUrl: string;
  ingredients: string[];
  cookSteps: string[];
  cookNote: string[];
}
```

프레임워크는 바뀌어도 데이터는 그대로다. 타입스크립트 인터페이스를 씌워주니 오히려 더 견고해졌다. 앱의 뼈대가 바뀌어도 아내가 쌓아둔 레시피라는 살은 그대로 남아있는 셈이다.

### 에이전트와의 협업

내가 직접 작성한 코드는 거의 없다. 하지만 방치된 앱을 되살리겠다는 **결정**, 어떤 방향으로 갈지에 대한 **디렉션**, 결과물에 대한 **피드백** — 이건 온전히 내 몫이었다.

에이전트에게 맡기면서 느낀 점 몇 가지:

**프레임워크 마이그레이션에 특히 강하다.** "이 AngularJS 1 코드를 Angular 20으로 바꿔줘"라는 요청은 기계적인 변환이 많다. 패턴이 정해져 있고, 베스트 프랙티스가 명확하다. 이런 종류의 작업은 에이전트가 사람보다 빠르고 실수도 적다.

**디자인 감각도 꽤 쓸만하다.** 카테고리별 이모지 매핑이라든가, 모달 기반의 레시피 상세 뷰라든가, 작지만 UX를 신경 쓴 흔적들이 보인다. 물론 세부 디자인은 내가 후속으로 다듬었지만.

**레거시 코드를 이해하는 능력이 핵심이다.** 10년 전 코드를 읽고, 의도를 파악하고, 현대적인 패턴으로 재구성하는 과정이 매끄러웠다. 사람이었다면 "이게 뭐야..." 하면서 한참 헤맸을 코드를.

### 마치며

죽었던 앱이 [다시 살아났다](https://zipbap.netlify.app/). 아내가 열심히 모아뒀던 레시피에 다시 생명을 불어넣을 수 있어서 뿌듯하다.

기술적으로 보면 AngularJS 1에서 Angular 20으로, Cordova에서 Capacitor로, Bower에서 npm으로, JavaScript에서 TypeScript로 — 프론트엔드 생태계 10년의 변화를 한 번에 건너뛴 셈이다. 이걸 사람 손으로 했다면 엄두도 못 냈을 것이고, 아마 영영 방치됐을 것이다.

AI 코딩 에이전트가 새로운 프로젝트를 빠르게 만드는 데만 쓸모 있는 게 아니라, 이렇게 죽어가는 프로젝트를 되살리는 데도 힘을 발휘한다는 걸 느꼈다. 서랍 속에 잠자고 있는 사이드 프로젝트가 있다면, 한번 꺼내보는 건 어떨까. 생각보다 쉽게 다시 숨을 불어넣을 수 있을지도 모른다.

**집밥 레시피**: [https://zipbap.netlify.app/](https://zipbap.netlify.app/)
