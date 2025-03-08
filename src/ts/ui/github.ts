import { Global } from "@src/ts/data/global";
import { URLType } from "@src/ts/data/model";
import { adjustGlobalUIObservably } from "@src/ts/ui/github/global_ui";
import { adjustUserUIObservably } from "@src/ts/ui/github/user_ui";
import { adjustRepoUIObservably } from "@src/ts/ui/github/repo_ui";
import { adjustOrgUIObservably } from "@src/ts/ui/github/org_ui";

// ========================
// adjust github ui related
// ========================

/**
 * Adjust GitHub UI, including global ui, user ui and repo ui, need to wrap observing outside.
 */
export function adjustGitHubUiObservably() {
    // 1. global UI (in observation)
    adjustGlobalUIObservably();

    // 2. user UI (in observation)
    if (Global.urlInfo.type == URLType.USER) {
        adjustUserUIObservably();
    }

    // 3. repo UI (in observation)
    if (Global.urlInfo.type == URLType.REPO) {
        adjustRepoUIObservably();
    }

    // 4. org UI (in observation)
    if (Global.urlInfo.type == URLType.ORG) {
        adjustOrgUIObservably();
    }
}
