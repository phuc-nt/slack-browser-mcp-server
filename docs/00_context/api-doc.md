# conversations.replies

## Request URL

Request URL
https://tbvaidatalearning.slack.com/api/conversations.replies?_x_id=5606742e-1754661696.781&_x_csid=7fCXRhEQZgs&slack_route=T07UZEWG7A9&_x_version_ts=1754656963&_x_frontend_build_type=current&_x_desktop_ia=4&_x_gantry=true&fp=4c&_x_num_retries=0

Request Method
POST

## Payload

\_x_id
5606742e-1754661696.781
\_x_csid
7fCXRhEQZgs
slack_route
T07UZEWG7A9
\_x_version_ts
1754656963
\_x_frontend_build_type
current
\_x_desktop_ia
4
\_x_gantry
true
fp
4c
\_x_num_retries
0
token
xoxc-7985506551349-7988356250018-9287087602039-c69a2c5afa7322ec9e3092b9bfa7974157cd88effb2f6969dd765c7b88c8dd42
channel
C099184U2TU
ts
1754661651.179039
inclusive
true
limit
28
oldest
1754661662.302739
cached_latest_updates
{"1754661651.179039":"1754661662.000800"}
\_x_reason
history-api/fetchReplies
\_x_mode
online
\_x_sonic
true
\_x_app_name
client

## Response

{
"ok": true,
"messages": [
{
"user": "U07V2AG7C0J",
"type": "message",
"ts": "1754661651.179039",
"client_msg_id": "bd5c920f-2d0d-45f9-9c99-150fc06c92d0",
"text": "new thread",
"team": "T07UZEWG7A9",
"thread_ts": "1754661651.179039",
"reply_count": 2,
"reply_users_count": 1,
"latest_reply": "1754661662.302739",
"reply_users": [
"U07V2AG7C0J"
],
"is_locked": false,
"subscribed": true,
"last_read": "1754661662.302739",
"blocks": [
{
"type": "rich_text",
"block_id": "OO+54",
"elements": [
{
"type": "rich_text_section",
"elements": [
{
"type": "text",
"text": "new thread"
}
]
}
]
}
]
},
{
"user": "U07V2AG7C0J",
"type": "message",
"ts": "1754661662.302739",
"client_msg_id": "e47e44d3-d984-477a-9b32-a8f8f07e4bf4",
"text": "new reply 2",
"team": "T07UZEWG7A9",
"thread_ts": "1754661651.179039",
"parent_user_id": "U07V2AG7C0J",
"blocks": [
{
"type": "rich_text",
"block_id": "CchrL",
"elements": [
{
"type": "rich_text_section",
"elements": [
{
"type": "text",
"text": "new reply 2"
}
]
}
]
}
]
}
],
"has_more": false,
"unchanged_messages": [
"1754661651.179039"
],
"latest_updates": {
"1754661662.302739": "1754661662.302739"
}
}

#

## Request URL

https://tbvaidatalearning.slack.com/api/search.inline?_x_id=5606742e-1754661327.875&_x_csid=8gLTqh89uy4&slack_route=T07UZEWG7A9&_x_version_ts=1754656963&_x_frontend_build_type=current&_x_desktop_ia=4&_x_gantry=true&fp=4c&_x_num_retries=0
Request Method
POST

## Payload

\_x_id
5606742e-1754661327.875
\_x_csid
8gLTqh89uy4
slack_route
T07UZEWG7A9
\_x_version_ts
1754656963
\_x_frontend_build_type
current
\_x_desktop_ia
4
\_x_gantry
true
fp
4c
\_x_num_retries
0
token
xoxc-7985506551349-7988356250018-9287087602039-c69a2c5afa7322ec9e3092b9bfa7974157cd88effb2f6969dd765c7b88c8dd42
search_session_id
cf5f495b-019b-4caa-a79d-04656ca7abbe
client_req_id
e92485b2-7518-46ce-b0a4-457713fab784
max_ts
1754661327
channel
C099184U2TU
count
3
page
1
query
test
thread_replies
extract_len
110
\_x_reason
quick-messages/prototype
\_x_mode
online
\_x_sonic
true
\_x_app_name
client

## Response

{
"ok": true,
"query": "test",
"pagination": {
"total_count": 2,
"page": 1,
"per_page": 3,
"page_count": 1,
"first": 1,
"last": 2
},
"items": [
{
"ts": "1754660758.563369",
"thread_ts": "1754660739.549139",
"extracts": [
{
"text": "*Test* post_thread_reply tool MCP server",
"truncated_head": false,
"truncated_tail": false
}
],
"user": "U07V2AG7C0J",
"permalink": "https:\/\/tbvaidatalearning.slack.com\/archives\/C099184U2TU\/p1754660758563369?thread_ts=1754660739.549139",
"iid": "d810cf3d-8b84-452c-b08c-585e7875a23c"
},
{
"ts": "1754405258.272689",
"extracts": [
{
"text": "\u0111\u00e2y l\u00e0 channel *test* mcp",
"truncated_head": false,
"truncated_tail": false
}
],
"user": "U07V2AG7C0J",
"permalink": "https:\/\/tbvaidatalearning.slack.com\/archives\/C099184U2TU\/p1754405258272689",
"iid": "59ed6a78-99d6-4863-b917-0d4842979243"
}
]
}

# search.modules.messages

## Request URL

https://tbvaidatalearning.slack.com/api/search.modules.messages?_x_id=5606742e-1754661773.033&_x_csid=7fCXRhEQZgs&slack_route=T07UZEWG7A9&_x_version_ts=1754656963&_x_frontend_build_type=current&_x_desktop_ia=4&_x_gantry=true&fp=4c&_x_num_retries=0
Request Method
POST

## Payload

\_x_id
5606742e-1754661869.996
\_x_csid
NqGPrFhE7uw
slack_route
T07UZEWG7A9
\_x_version_ts
1754656963
\_x_frontend_build_type
current
\_x_desktop_ia
4
\_x_gantry
true
fp
4c
\_x_num_retries
0
token
xoxc-7985506551349-7988356250018-9287087602039-c69a2c5afa7322ec9e3092b9bfa7974157cd88effb2f6969dd765c7b88c8dd42
module
messages
query
in:<#C099184U2TU|mcp_test> before:2025-08-09 after:2025-07-31 test
page
1
client_req_id
d2996d1f-4f3a-4a5e-8dc5-65ba5905a172
search_session_id
cf5f495b-019b-4caa-a79d-04656ca7abbe
extracts
1
highlight
1
max_extract_len
200
extra_message_data
1
no_user_profile
1
count
20
file_title_only
false
query_rewrite_disabled
false
include_files_shares
1
search_context
desktop_messages_tab
search_exclude_bots
false
search_only_my_channels
false
spell_correction
FUZZY_MATCH
search_only_team
facets_result_count
5
query_refinement_suggestions_version
1
recent_channels
C099184U2TU-1754661651.179039,C099184U2TU
sort
score
sort_dir
desc
max_filter_suggestions
10
request_context
{"active_cid":"SearchEmpty","recent_filter_in":["C099184U2TU"],"recent_filter_from":[]}
search_tab_filter
messages
search_tab_sort
score
\_x_reason
search-new-query
\_x_mode
online
\_x_sonic
true
\_x_app_name
client

## Response

{
"ok": true,
"pagination": {
"total_count": 2,
"page": 1,
"per_page": 20,
"page_count": 1,
"first": 1,
"last": 2
},
"query": "in:<#C099184U2TU|mcp_test> before:2025-08-09 after:2025-07-31 test",
"filters": {
"in": [
"C099184U2TU"
],
"before": "2025-08-09",
"after": "2025-07-31"
},
"module": "messages",
"items": [
{
"iid": "bd94c77b-beb2-4fda-8bdb-4d547630e7b9",
"team": "T07UZEWG7A9",
"channel": {
"id": "C099184U2TU",
"is_channel": true,
"is_group": false,
"is_im": false,
"is_mpim": false,
"is_shared": false,
"is_org_shared": false,
"is_ext_shared": false,
"is_private": true,
"name": "mcp_test",
"pending_shared": [],
"is_pending_ext_shared": false
},
"messages": [
{
"ts": "1754405258.272689",
"user": "U07V2AG7C0J",
"iid": "40b3a5a1-a9ff-4fa4-bc83-70acaa69674a",
"text": "\u0111\u00e2y l\u00e0 channel \ue000test\ue001 mcp",
"permalink": "https:\/\/tbvaidatalearning.slack.com\/archives\/C099184U2TU\/p1754405258272689?thread_ts=1754405258.272689",
"extracts": [
{
"text": "\u0111\u00e2y l\u00e0 channel \ue000test\ue001 mcp",
"truncated_head": false,
"truncated_tail": false
}
],
"username": "phucnt0",
"reply_count": 2,
"latest_reply": "1754660664.713999",
"blocks": [
{
"type": "rich_text",
"block_id": "wCeCH",
"elements": [
{
"type": "rich_text_section",
"elements": [
{
"type": "text",
"text": "\u0111\u00e2y l\u00e0 channel "
},
{
"type": "text",
"text": "test",
"style": {
"client_highlight": true
}
},
{
"type": "text",
"text": " mcp"
}
]
}
]
}
],
"blocks_extracts": [
{
"type": "rich_text",
"block_id": "wCeCH",
"elements": [
{
"type": "rich_text_section",
"elements": [
{
"type": "text",
"text": "\u0111\u00e2y l\u00e0 channel "
},
{
"type": "text",
"text": "test",
"style": {
"client_highlight": true
}
},
{
"type": "text",
"text": " mcp"
}
]
}
]
}
],
"thread_ts": "1754405258.272689"
}
]
},
{
"iid": "978b09ab-2a3c-4fda-8456-8299e1230216",
"team": "T07UZEWG7A9",
"channel": {
"id": "C099184U2TU",
"is_channel": true,
"is_group": false,
"is_im": false,
"is_mpim": false,
"is_shared": false,
"is_org_shared": false,
"is_ext_shared": false,
"is_private": true,
"name": "mcp_test",
"pending_shared": [],
"is_pending_ext_shared": false
},
"messages": [
{
"ts": "1754660758.563369",
"user": "U07V2AG7C0J",
"iid": "b6b792af-53bf-4486-b28c-25fdf160c2b4",
"text": "\ue000Test\ue001 post_thread_reply tool MCP server",
"permalink": "https:\/\/tbvaidatalearning.slack.com\/archives\/C099184U2TU\/p1754660758563369?thread_ts=1754660739.549139",
"extracts": [
{
"text": "\ue000Test\ue001 post_thread_reply tool MCP server",
"truncated_head": false,
"truncated_tail": false
}
],
"username": "phucnt0",
"blocks": [
{
"type": "rich_text",
"block_id": "4pXMR",
"elements": [
{
"type": "rich_text_section",
"elements": [
{
"type": "text",
"text": "Test post_thread_reply tool MCP server"
}
]
}
]
}
],
"blocks_extracts": [
{
"type": "rich_text",
"block_id": "4pXMR",
"elements": [
{
"type": "rich_text_section",
"elements": [
{
"type": "text",
"text": "Test post_thread_reply tool MCP server"
}
]
}
]
}
],
"thread_ts": "1754660739.549139"
}
]
}
],
"filter_suggestions": {
"in": [
{
"id": "C099184U2TU",
"facet_count": 2,
"checked": true
}
],
"from": [
{
"id": "U07V2AG7C0J",
"facet_count": 2
}
]
}
}
