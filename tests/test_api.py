from fastapi.testclient import TestClient
import pytest

from src.app import app, activities

client = TestClient(app)


def test_get_activities_initial():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Ensure data has some known activities
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"].get("participants"), list)


def test_signup_and_unregister_flow():
    activity = "Programming Class"
    email = "test_student@mergington.edu"

    # Ensure email is not already registered
    resp = client.get("/activities")
    assert resp.status_code == 200
    assert email not in resp.json()[activity]["participants"]

    # Sign up
    signup_resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert signup_resp.status_code == 200
    assert f"Signed up {email} for {activity}" in signup_resp.json().get("message", "")

    # Verify participant now present
    resp2 = client.get("/activities")
    assert email in resp2.json()[activity]["participants"]

    # Unregister
    delete_resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert delete_resp.status_code == 200
    assert f"Unregistered {email} from {activity}" in delete_resp.json().get("message", "")

    # Verify participant removed
    resp3 = client.get("/activities")
    assert email not in resp3.json()[activity]["participants"]


def test_signup_duplicate_fails():
    activity = "Chess Club"
    # Use an existing email from initial data
    existing = activities[activity]["participants"][0]

    # Attempt to sign up the already-registered user
    resp = client.post(f"/activities/{activity}/signup?email={existing}")
    # The app checks for globally-signed up students across activities and returns 400
    assert resp.status_code == 400
    assert resp.json().get("detail")


def test_unregister_not_found():
    activity = "Gym Class"
    email = "nonexistent_person@mergington.edu"

    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 404
    assert resp.json().get("detail")
