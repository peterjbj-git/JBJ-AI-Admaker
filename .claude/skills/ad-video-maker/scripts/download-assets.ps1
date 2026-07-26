<#
  download-assets.ps1 — 힉스필드 생성물 일괄 다운로드
  사용법:
    powershell -File download-assets.ps1 -ManifestPath manifest.json
  manifest.json 형식:
    [ { "url": "https://...", "path": "ad-videos/<slug>/assets/scene-1.mp4" }, ... ]
#>
param(
    [Parameter(Mandatory = $true)][string]$ManifestPath,
    [int]$MaxRetries = 3,
    [int]$TimeoutSec = 300,
    [int]$MinBytes = 1024
)

$ErrorActionPreference = "Stop"
# 성능 최적화: 진행률 UI 렌더링이 Invoke-WebRequest 속도를 크게 저하시키므로 비활성화
$ProgressPreference = "SilentlyContinue"
$failed = @()

try {
    $items = Get-Content -Path $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
    Write-Host "[ERROR] 매니페스트 읽기 실패: $($_.Exception.Message)"
    exit 1
}

foreach ($item in $items) {
    $dir = Split-Path -Parent $item.path
    if ($dir -and -not (Test-Path $dir)) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }

    $ok = $false
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            Invoke-WebRequest -Uri $item.url -OutFile $item.path -TimeoutSec $TimeoutSec -UseBasicParsing
            $size = (Get-Item $item.path).Length
            if ($size -lt $MinBytes) { throw "파일 크기 비정상 ($size bytes)" }
            Write-Host "[OK] $($item.path) ($([math]::Round($size / 1MB, 2)) MB)"
            $ok = $true
            break
        } catch {
            Write-Host "[RETRY $i/$MaxRetries] $($item.path): $($_.Exception.Message)"
            # 성능·안정성: 지수 백오프로 서버 부하 및 일시 오류 회피
            Start-Sleep -Seconds ([math]::Pow(2, $i))
        }
    }
    if (-not $ok) { $failed += $item.path }
}

if ($failed.Count -gt 0) {
    Write-Host "[FAILED] 다운로드 실패 목록:"
    $failed | ForEach-Object { Write-Host "  - $_" }
    exit 2
}
Write-Host "[DONE] 전체 $($items.Count)건 다운로드 완료"
exit 0
