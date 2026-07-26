import { Config } from "@remotion/cli/config";

// 렌더링 성능 최적화: jpeg 프레임 포맷이 png 대비 인코딩 속도 우위
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
