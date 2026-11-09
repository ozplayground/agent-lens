"""T8: sources.json 저장의 rename 이 실패할 때 제자리 쓰기 대체 경로 (make-targets, spec 1.9).

Docker 의 단일 파일 bind mount 위로 rename 하면 Linux 가 EBUSY 를 낸다.
그때도 save_sources 는 대상 파일에 새 내용을 쓰고 임시 파일을 남기지 않아야 한다.
일반 파일에서는 지금처럼 임시 파일을 rename 으로 교체한다.

autouse llm_isolation 이 sources_service 를 세션 사본(_file_path = _mirror_path)으로 돌려 두었으므로 그 사본에 쓴다.
"""
import copy
import errno
import json
import pathlib

from app.services.sources_service import sources_service


def _read_json(p):
    with open(p, "r", encoding="utf-8") as f:
        return json.load(f)


def test_save_sources_falls_back_to_in_place_write_on_ebusy(monkeypatch):
    target = sources_service.get_file_path()
    data = copy.deepcopy(sources_service.load_sources())

    calls = {"n": 0}

    def busy_replace(self, target_path):
        calls["n"] += 1
        raise OSError(errno.EBUSY, "Device or resource busy")

    monkeypatch.setattr(pathlib.Path, "replace", busy_replace)

    assert sources_service.save_sources(data) is True
    assert calls["n"] == 1
    assert _read_json(target) == data
    assert not (target.parent / "sources.tmp").exists()


def test_save_sources_uses_atomic_replace_normally(monkeypatch):
    target = sources_service.get_file_path()
    data = copy.deepcopy(sources_service.load_sources())

    original_replace = pathlib.Path.replace
    calls = {"n": 0}

    def spy_replace(self, target_path):
        calls["n"] += 1
        return original_replace(self, target_path)

    monkeypatch.setattr(pathlib.Path, "replace", spy_replace)

    assert sources_service.save_sources(data) is True
    assert calls["n"] == 1
    assert _read_json(target) == data
    assert not (target.parent / "sources.tmp").exists()
