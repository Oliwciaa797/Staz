const dropdown = document.getElementById("history-dropdown");

async function loadHistory() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) return;

    const { data } = await supabaseClient
        .from("watch_history")
        .select("video_id,title")
        .eq("user_id", user.id)
        .order("watched_at", { ascending:false })
        .limit(10);

    dropdown.innerHTML = "";

    data.forEach(video => {

        dropdown.innerHTML += `
            <a class="history-video"
               href="../Video/video.html?video=${video.video_id}">

                <img src="https://img.youtube.com/vi/${video.video_id}/default.jpg">

                <span>${video.title}</span>

            </a>
        `;
    });

    // dropdown.innerHTML += `
    //     <hr>

    //     <a class="history-video" href="../History/history.html">
    //         View Full History
    //     </a>
    // `;
}

loadHistory();

window.loadHistory = loadHistory;