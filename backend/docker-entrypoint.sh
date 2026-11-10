#!/bin/sh
# root 로 시작하면 bind mount 된 config.json 의 소유자(uid:gid)로 내려가 실행한다.
# 그래야 호스트 사용자 소유의 config.json·sources.json 을 설정 화면에서 저장할 수 있다.
# 소유자가 root(0)이거나 파일이 없으면(예: macOS Docker Desktop 은 0:0 으로 보인다) 1000:1000 을 쓴다.
# 데이터 볼륨(/app/data)과 임시 파일을 쓰는 /app, sources.json 미러 폴더는 그 uid 소유로 맞춘다.
# bind mount 파일 자체의 소유자는 바꾸지 않는다.
set -e
if [ "$(id -u)" = "0" ]; then
  owner="$(stat -c '%u:%g' /app/config.json 2>/dev/null || echo 0:0)"
  case "$owner" in
    0:*) owner="1000:1000" ;;
  esac
  chown "$owner" /app /app/app/config
  chown -R "$owner" /app/data
  exec setpriv --reuid="${owner%%:*}" --regid="${owner##*:}" --clear-groups "$@"
fi
exec "$@"
