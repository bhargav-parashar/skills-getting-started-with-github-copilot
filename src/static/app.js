document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear previous options in the select dropdown except the default
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        // Ensure participants is always an array
        const participants = Array.isArray(details.participants) ? details.participants : [];

        const spotsLeft = details.max_participants - participants.length;

        const participantsList = participants.length > 0
          ? `
            <div class="participants-section">
              <h5>Current Participants:</h5>
              <ul class="participants-list">
                ${participants.map(email => `
                  <li>
                    <span class="participant-email">${email}</span>
                    <button class="participant-remove" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" title="Remove participant">✖</button>
                  </li>
                `).join('')}
              </ul>
            </div>
          `
          : '<p class="no-participants">No participants yet</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsList}
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        // keep the base 'message' class so styles apply consistently
        messageDiv.className = "message success";
        signupForm.reset();
        // refresh the activities list so UI updates immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Event delegation for participant remove buttons
  activitiesList.addEventListener('click', async (e) => {
    const btn = e.target.closest('.participant-remove');
    if (!btn) return;

    const activityName = decodeURIComponent(btn.getAttribute('data-activity'));
    const email = decodeURIComponent(btn.getAttribute('data-email'));

    if (!activityName || !email) return;

    if (!confirm(`Remove ${email} from ${activityName}?`)) return;

    try {
      const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });

      const result = await resp.json();
      if (resp.ok) {
        // Refresh activities list to reflect removal
        fetchActivities();
        messageDiv.textContent = result.message || 'Participant removed';
        messageDiv.className = 'message success';
        messageDiv.classList.remove('hidden');
        setTimeout(() => messageDiv.classList.add('hidden'), 3000);
      } else {
        messageDiv.textContent = result.detail || 'Failed to remove participant';
        messageDiv.className = 'message error';
        messageDiv.classList.remove('hidden');
      }
    } catch (err) {
      console.error('Error removing participant:', err);
      messageDiv.textContent = 'Failed to remove participant. Please try again.';
      messageDiv.className = 'error';
      messageDiv.classList.remove('hidden');
    }
  });
});
