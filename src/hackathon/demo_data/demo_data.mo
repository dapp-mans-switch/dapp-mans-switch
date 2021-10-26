
import Types "../types";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import D "mo:base/Debug";
import Date "../utils/date";
import Staker "../staker";
import Array "mo:base/Array";

module {
    type Stake = Types.Stake;
    type Staker = Types.Staker;
    type Secret = Types.Secret;
    
    public class Constants() {
        public let defaultId: Principal = Principal.fromText("oddqh-xd2vh-lpiiv-fugkv-oom44-djoit-rczru-6bl2x-j2jtr-lmyhu-yae");
        public let aliceId: Principal = Principal.fromText("npoeh-hihb4-msxlf-foqy3-u2e3y-pj2iq-453cf-jtf6d-myhjn-kvm6f-vqe");
        public let bobId: Principal = Principal.fromText("7vapn-lv4ut-e55mv-yr7sy-iu5td-y6qz2-teij6-rvmxf-pnf5q-cijxz-uqe");

        public let puplic_key: Text = "+Jee1ZHe4ZtfhQr8dUuHlxhvkP0sH6Qu5WVeC0fBCe4=";
        public let private_key: Text = "oM76Mg310VaiM7SLvRIM+OtQSOr900jZB8hfVyZfMgX4l57Vkd7hm1+FCvx1S4eXGG+Q/SwfpC7lZV4LR8EJ7g==";

        public let shares: [Text] = [
            "+1BIWtxnARA1g6P59QqaDJnik3UnRG0iHmtyqyhxmK2nlC1n+lAMGzgvYqIhl0CsQDpIq0dhE42T8owkpAsTNUTC99/lwP+Hkd7gF/AfinzXG3P5hf9gEr+fF8zPLkUWHLi31OdNgVnRUHiCkFpcV4eqFGcK+R0iOcmk10+y+hzr/gSAGV7Ogw==.d0oNzDp0TwbLPwQftpus3M5iDIGvFST+",
            "2/7RK0JGs51tGjnOmzrFwzM7mK3axEDzb08AsuOMeosnRAHe5Vbj/PPiw5kMB09MN1jaSwZylzTRjVKKYGt+HKEzEIEol+0m6vxVNS3Vj5XmIE5oIVeDwjuWZUOMeG1QtHcu/O4ygsjZ4hUI4yTE8R3/t5MbFtEXFIxQ/15xIj7DvThMw+JYjA==.V69nA+PHkg2U2RyqAbdKs/baQ/dR27gA",
            "Ov45xJ5PNNaNSvj3a4KyEXKjQpPIaIFMkgR7HSSXEeOwlnVk1W5h6iafjsb1nbeV7Hc4mCB34bcvdXzzQ12QAxu3HS1HEm0EDxRx43gs3u6U0hZ68bHwbtznDx77dgLMCW3ywvoZ12+ygjLV6ok9AvrVjPFdKHGLCQCZwruK1qsQ7l1ZacmUvA==.VX8Xv6nlt+DWk8rxJX5mNAUzkaQ1svKf",
            "hCvBA5uvEvcQrfgr27XJ+YAMOiJniVh42mU8rLgj1DPsCJuEPl92z6JbcOyFDa/rgq9WpI/fe6F0eB2EK2xdQt3QStoRJtHkgxDtUplmw63w2DI+El5RaEon90keTu+1JAB0s+tWNShmg16L3ibSeZlAVWH5bCcgJsqQBIu1LnuulZboT9ohOw==.p6MnALDje/HemRcjZCT6ARvQqz7lIJBi",
            "j/ptGWh0A8bw5x0pyd4CgCORijFMB0fJBu+1NZxDgaqbyXEcjTVToWp2FgqxuNF5zmhemji6ze7xuE8UJU6T6UCL6qNWRHPISzcR9qbb0xXwScai4pwpCxnz8T5NiDXJ/v++8e3f0aad+Z1rgdcHzyLxEKE6Vw5dS7Z5pbMMkWj+EFsynuxnrg==.9/BuffrKONH8kdMe/fQXlT6i4y6e9UX/",
            "XyeaeHGy8xNrnBUHq8YgJQ+Wy1e0GK1FuaQ++V7TdmAYpdNAMe25qYr9a2kE9CIFBW6SRgBeU5u4qEshT949H5yR6aH41jF/Px6IPdsRZ/0RtuwNku0ighukHEKAjQzLgE+S4JHsNGguDXSUoF5H1vGTEtUWE8QYKhPVfBDFFlHqTvmGZ+z3AQ==.3eYB6eZt+fSyv/NClhU2TORbCeWddn0A",
            "TELc8TQIQxVVLh8XAdgFqxzNgoFd5yB/GNDGw3EhFdmxaKNO99Z0K0lvi0pNV2+LIy9xTJS6aYlBVCd6zVE6YF7Ziy40qRY8revnr4HPBH+L1BgOEOse/KnFcIFUiX16sG+Mkbq6IXjAiDH+VZ/QviiJhEH0cQHe88W3Dn8YtaKsSi77CTUQ/w==.c4fEYhNP0zTrj1p4wu7ZYx764OChZ9jN",
            "kf6kP4zAnL0UkHn2jnAPGEjVcXh5GZ5TT0bjuanV5Q+7abPH+qWhKpgwIzToPQzzLMHUwHJUbIP9RGq3zuTQInYaH3zCA9Cxh8wSx7vvKtNvdvrINNVisDvqxM5XTif1zlqBiGRC+GwWk7+RGYbWjJju1agt67BAw6wmmqUbFW5RPcvfJkxR7A==.uupl1WXQOPs8MTmK6JF2CVq0NF3DM8f9",
            "H8wbfCrNhHX9hho5g35CDynguXsMEEgiaPEm7sF3O/xWpXdKmhq/RobuWztlK5nZBGhO91yf7aTJlcmAnvGlP0fNEnBqeR14V5jMs9Db3SFzl8vIlThTGFazt27lW/gGnSXTtTtC217kK0Z/D82Mpq3xFnqf3x4KiNBdNtW8d8g5XrYuB4XqpQ==.LR5NbvNoDOE35vMHmEhnVf5YkmyZ7M7/",
            "qW+6FYqBIROOwGuJV/bMWABQz/RrfaMNnsSSjVhBrxA99OZ73l46AzGWBXiFxG5Jt6GZopEs53ATGc72GNv/jXbl8F5UK9SK/cQXRElk2K32pDMvkNhR/kBCOkq3MTi3rPeOMem3RdGefq7mxC8uElAJdr5vbMEL4ke9CW3fIKYRnnEEK2V4pw==.MLf4MD9n9FWdr69WeiGnyWLpcCMfHMMH"
        ];

        public let decrypted_shares: [Text] = [
            "Z5M8ucM6qClEZBKJp/f72Vp+bKdbItz8K5j0vTR52QTVbBv+LopdOgnP9v3LaZLjFo6nUjJNe8xgP4pMSs6bThe0xfH5YB20WZ5hZ+iPwOq7BFJdHP8p9g==",
            "ao7xwV8PkrOV7ZraSGHpfKKsCC0UvatbyIhFjoj+XTQZtEoX+pBG0iqoVdf2ctlWn2Nnubp+lQVNbIrc6ZzV/eLbiJNprvxZZURK8FAU9Zpx23bvE1aVyQ==",
            "Ge91f3CyDDfWc+D0XWKwRGODP1OM+2KAX2mvWqEnrcaogc7PlECHCOWt3lo5kumWbfoxRX5Hzeq0MAVN8u6vxooWkSeL8wPtU5RmfCpqwnIlGnVarWzQrQ==",
            "IsfFhBeJKx6pkMbWKeqj2aoo+5VSe8iqWnJN2GT6aHeJXqLbpxkFRDO+1wDULoIPvKL2MOPDpeU4LTwMu/xbZ6rkbuL9a5uQaD1H4CnOdxT1eZly/hI1WQ==",
            "QiaVJc3fYDPVc/GoPg+1DXebeQJHH+bEhC3st9ZyrM/K3ZIn0gvVhaoR3HauZAznMJ2Qtg6rUvxWQTfHpMKPt2XmjGt4xHE9DtHOFQGByc9kMtHpBJattw==",
            "JNXQRzJw983HM9knc+IxOMUN5i8qf3+t4IH0HTGCJy3rzkOv3sCBB/MGQsHjn0lBfHQvZqGebq7nnewCe1ccp51iTJjAChA2GosRvxAYCnT4W01qiSfBbQ==",
            "M5xzhkbI+gaNGP+H56bsarWbbTbXKBCo8Mksa8ns/i6IJrg5jOb6DeUhc4KlbTy8O2z/DYLRkexR2JYmdL57QB5bJDsbz3y0VEuYz57zdJ3QohJTuzcILA==",
            "1VwV1pOmo0o8lQR4t3ldKmDVX/3JRWs8Krm/qn4AMSHADbp39HW54fHb57YZluZ2bLFT7c9JU9va5ld9RxWg1gxWihMlYHfgXxNSO/zIkJiZ38twPvW73A==",
            "u5v0Sjfd4QbxV7mq8AN46Pl99OL7kLkOLTO4l4ou6Nur60ehdKTHk4prem4aC/vZeUCmzpr1D9im5DA7taKrPcXXQoYrPltDSe0zDLlM+fEcvmKP99pF5A==",
            "naNB2cOhaJ9YY9g1A5mqlRphfF5zdx5BBh9LZ/Lr2IppldmZw1rP3PBnZlfX80hKhl+eWtkYtT32fSXahiRXH0ri3rKwNhmFNkrPnfZiL8TRsCJ5OCdi2g=="
        ];

        public let shas: [Text] = [
            "b1314393dd5590fb165b41e84ef499cdb1e7db1a0c2a7c40a65c4d7b62194653",
            "0efc7a0d693566d67e9b03a180bbaf1ec5a5940e7270224914717e7965ee0de0",
            "b9e5b5ac52e221a12058dd2c590cf39793506689ae27cbfe740e23de6e39c2bf",
            "93e49e82440848aff41fe08ec55a424a9caf39fa32e7db32ba7b48a41dc0c018",
            "b5477a9cc9d908edf1f8c1e2bfaddcdcc7f877eb43c80385c90444908584a130",
            "859133728a3fcbb13f645203f6ddba4dde639e9cbee7cabd5fe6aed447850d07",
            "145c62902dbcf40ea630209f7690614ae69593a32d5ba76d18b8e3172c7696e4",
            "6cb00611c07527d7ff6965e4f123ec82aa3361f2f8dd4de14aa28f768ca8c769",
            "1471b3b4b3540319bb3a7874ce3c96837b6aa1feadf482e53cc89dff2da0abb9",
            "3ab38eb921ce4ee91211a2d68f4046a74ac46a0106e2ee58d8911e0c26b958c9"
        ];

        public let secret_public_key = "hPNWOv9BgvEvsQCbdgJEQdwVaBFnfxmzJ+FO9FcBSY0=";

        public let payloads = [
            "W+7emmQbDaJlFCZJ0RUE1SPwlCtIZvi8P+oNvscZ.lcbL2dkCK4k604poc9FYQL2lDqf54fjU", // My top secret.
            "f1D+5N5327l5Sr84Mkc1J761fA0FLqrrXTKw7duui+s=.ZsrhvWyUJuiMAe32A+DAe7yGC9Bq4pmS", // Give me money for M1 max pls
            "PqEb5rCVkUi/kwpkaWXR96dAMDvFA+YG+6JO62ZLDdsOMDik2oak5JdetdM=.OXD4/bGDAeEAW/ObImjGqNFP2YpA6mj3",
            "D1opz1XCuR8KMDdAyM/5MK15JL/RdCCk0XR+avt8WxQpiQG/R12yzw==.uEYRJtaGzee8PkH6yjMA92diXmMCF9tr", // Internet Computer Rocks!
            "D/teXclqFyctXJi3oczZwNN2avM5RfcZuYzJuWbbD48=.gu7vdhIHAOCLa5SAdOj7DnnY9GdzrQyq", // "Dfinity is cool!"
            "5DtI0XCNoNyA7+JBQUgFxa1Vk1Cxj0xlf7u2FiWoR2yVaYx9pL85M69ieIaog6y6W+OGVLu2gU5v8zByFjW2gBtrJp8=.hxaOprRv7T6rPCa/aOmKa+1gk4pYtQXo", // I'm glad there is a decentralised Dead Man's Switch!
            "Td5CfwWglzVnlTzlnQQFzs88MO4OoKj2tqmHaHKPoTt3xqBL5umtVGKr5t3V7Z2Yxw==.0rWQwPo+6unzAQJSskFHlhd34kqYddt3", // Here, is my password: password123
            "KRmddLAaiFWjyhHt6OtJKfqCTjnSvqtej9B7LVokhpBeTBv//gzLip4BkzpXT1AL7Dt4me7yhYMJ01JoKwWgFK3mGuc8BMgAGQI0bdg0wOf6UdGObnf7wBVNCxKcELtFuMNyFHI39SkGiypTrA4VwlxJVKM=.fxDA63+2UN8A1y81170YtJ4Md2dhhZjf"
        ];
    };


    public func addStakers(caller: Principal, stakers: HashMap.HashMap<Principal, Text>) {
        let c = Constants();
        stakers.put(c.defaultId, c.puplic_key);
        stakers.put(c.aliceId, c.puplic_key);
        stakers.put(c.bobId, c.puplic_key); 
        stakers.put(caller, c.puplic_key);
    };

    public func addStakes(caller: Principal, stakes: HashMap.HashMap<Nat, Stake>) {
        let c = Constants();

        let now = Date.secondsSince1970();
        stakes.put(1, {
            stake_id=1;
            valid=true;
            public_key=c.puplic_key;
            expiry_time=now+365*86400;
            staker_id=c.defaultId;
            amount=100;
        });
        stakes.put(2, {
            stake_id=2;
            valid=true;
            public_key=c.puplic_key;
            expiry_time=now+365*86400;
            staker_id=c.aliceId;
            amount=200;
        });
        stakes.put(3, {
            stake_id=3;
            valid=true;
            public_key=c.puplic_key;
            expiry_time=now+365*86400;
            staker_id=c.bobId;
            amount=300;
        });

        stakes.put(3, {
            stake_id=3;
            valid=true;
            public_key=c.puplic_key;
            expiry_time=now+365*86400;
            staker_id=caller;
            amount=100;
        });
        stakes.put(4, {
            stake_id=4;
            valid=false;
            public_key=c.puplic_key;
            expiry_time=now+365*86400;
            staker_id=caller;
            amount=100;
        });
        stakes.put(5, {
            stake_id=5;
            valid=true;
            public_key=c.puplic_key;
            expiry_time=now+30*86400;
            staker_id=caller;
            amount=12;
        });
    };

    public func addSecrets(caller: Principal, stakerManager: Staker.StakerManager, secrets: HashMap.HashMap<Nat, Secret>) {
        let c = Constants();
        let now = Date.secondsSince1970();

        // decrypted secret in the past
        var id = 1;
        var share_holder_stake_ids = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // caller is 3,4,5
        var revealed = [true, true, true, true, true, true, true, true, true, true];
        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                let newSecret = {
                    secret_id = id;
                    author_id = c.aliceId;

                    payload = c.payloads[4];
                    uploader_public_key = c.secret_public_key;
                    reward = 10;

                    expiry_time = now - 100000;
                    last_heartbeat = now - 100000;
                    heartbeat_freq = 86400;

                    share_holder_ids = share_holder_ids;
                    share_holder_stake_ids = share_holder_stake_ids;

                    shares=Array.tabulate(share_holder_stake_ids.size(), func (i: Nat): Text {
                        if (revealed[i]) {
                            return c.decrypted_shares[i];
                        } else {
                            return c.shares[i];
                        };
                    });
                    decrypted_share_shas = c.shas;
                    revealed = revealed;
                }; 
                secrets.put(id, newSecret);
            };
            case _ {};
        };

        id += 1; // 2
        share_holder_stake_ids := [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // caller is 3,4,5
        revealed := [true, true, true, true, true, true, true, true, true, true];
        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                let newSecret = {
                    secret_id = id;
                    author_id = c.aliceId;

                    payload = c.payloads[5];
                    uploader_public_key = c.secret_public_key;
                    reward = 10;

                    expiry_time = now - 100000;
                    last_heartbeat = now - 100000;
                    heartbeat_freq = 86400;

                    share_holder_ids = share_holder_ids;
                    share_holder_stake_ids = share_holder_stake_ids;

                    shares=Array.tabulate(share_holder_stake_ids.size(), func (i: Nat): Text {
                        if (revealed[i]) {
                            return c.decrypted_shares[i];
                        } else {
                            return c.shares[i];
                        };
                    });
                    decrypted_share_shas = c.shas;
                    revealed = revealed;
                }; 
                secrets.put(id, newSecret);
            };
            case _ {};
        };

        // almost decrypted secret, interaction of caller reveals is
        id += 1; // 3
        share_holder_stake_ids := [1, 1, 1, 1, 1, 1, 1, 5, 5, 5]; // caller is 3,4,5
        revealed := [true, true, true, true, false, false, false, false, false, false];
        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                let newSecret = {
                    secret_id = id;
                    author_id = c.aliceId;

                    payload = c.payloads[6];
                    uploader_public_key = c.secret_public_key;
                    reward = 10;

                    expiry_time = now + 100000;
                    last_heartbeat = now - 100000;
                    heartbeat_freq = 86400;

                    share_holder_ids = share_holder_ids;
                    share_holder_stake_ids = share_holder_stake_ids;

                    shares=Array.tabulate(share_holder_stake_ids.size(), func (i: Nat): Text {
                        if (revealed[i]) {
                            return c.decrypted_shares[i];
                        } else {
                            return c.shares[i];
                        };
                    });
                    decrypted_share_shas = c.shas;
                    revealed = revealed;
                }; 
                secrets.put(id, newSecret);
            };
            case _ {};
        };

        // expired not decrypted secret, caller can request payout
        id += 1; // 4
        share_holder_stake_ids := [1, 1, 1, 1, 1, 5, 5, 5, 5, 5]; // caller is 3,4,5
        revealed := [false, false, false, false, false, false, false, false, false, false];
        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                let newSecret = {
                    secret_id = id;
                    author_id = c.aliceId;

                    payload = c.payloads[2];
                    uploader_public_key = c.secret_public_key;
                    reward = 10;

                    expiry_time = now - 100000;
                    last_heartbeat = now - 100000;
                    heartbeat_freq = 86400;

                    share_holder_ids = share_holder_ids;
                    share_holder_stake_ids = share_holder_stake_ids;

                    shares=Array.tabulate(share_holder_stake_ids.size(), func (i: Nat): Text {
                        if (revealed[i]) {
                            return c.decrypted_shares[i];
                        } else {
                            return c.shares[i];
                        };
                    });
                    decrypted_share_shas = c.shas;
                    revealed = revealed;
                }; 
                secrets.put(id, newSecret);
            };
            case _ {};
        };

        // secret with alive author
        id += 1; // 5
        share_holder_stake_ids := [1, 1, 1, 1, 1, 1, 1, 1, 5, 5]; // caller is 3,4,5
        revealed := [false, false, false, false, false, false, false, false, false, false];
        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                let newSecret = {
                    secret_id = id;
                    author_id = c.aliceId;

                    payload = c.payloads[3];
                    uploader_public_key = c.secret_public_key;
                    reward = 10;

                    expiry_time = now + 250000;
                    last_heartbeat = now - 5000;
                    heartbeat_freq = 86400;

                    share_holder_ids = share_holder_ids;
                    share_holder_stake_ids = share_holder_stake_ids;

                    shares=Array.tabulate(share_holder_stake_ids.size(), func (i: Nat): Text {
                        if (revealed[i]) {
                            return c.decrypted_shares[i];
                        } else {
                            return c.shares[i];
                        };
                    });
                    decrypted_share_shas = c.shas;
                    revealed = revealed;
                }; 
                secrets.put(id, newSecret);
            };
            case _ {};
        };

        // expired, caller did payout
        id += 1; // 6
        share_holder_stake_ids := [1, 1, 1, 1, 1, 1, 1, 1, 5, 5]; // caller is 3,4,5
        revealed := [false, false, false, false, false, false, false, false, true, true];
        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                let newSecret = {
                    secret_id = id;
                    author_id = c.aliceId;

                    payload = c.payloads[3];
                    uploader_public_key = c.secret_public_key;
                    reward = 10;

                    expiry_time = now - 1500000;
                    last_heartbeat = now - 150000;
                    heartbeat_freq = 86400;

                    share_holder_ids = share_holder_ids;
                    share_holder_stake_ids = share_holder_stake_ids;

                    shares=Array.tabulate(share_holder_stake_ids.size(), func (i: Nat): Text {
                        if (revealed[i]) {
                            return c.decrypted_shares[i];
                        } else {
                            return c.shares[i];
                        };
                    });
                    decrypted_share_shas = c.shas;
                    revealed = revealed;
                }; 
                secrets.put(id, newSecret);
            };
            case _ {};
        };

        // caller secrets

        // alive
        id += 1; // 7
        share_holder_stake_ids := [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // caller is 3,4,5
        revealed := [false, false, false, false, false, false, false, false, false, false];
        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                let newSecret = {
                    secret_id = id;
                    author_id = caller;

                    payload = c.payloads[3];
                    uploader_public_key = c.secret_public_key;
                    reward = 10;

                    expiry_time = now + 250000;
                    last_heartbeat = now - 1000;
                    heartbeat_freq = 86400;

                    share_holder_ids = share_holder_ids;
                    share_holder_stake_ids = share_holder_stake_ids;

                    shares=Array.tabulate(share_holder_stake_ids.size(), func (i: Nat): Text {
                        if (revealed[i]) {
                            return c.decrypted_shares[i];
                        } else {
                            return c.shares[i];
                        };
                    });
                    decrypted_share_shas = c.shas;
                    revealed = revealed;
                }; 
                secrets.put(id, newSecret);
            };
            case _ {};
        };

        // expired
        id += 1; // 8
        share_holder_stake_ids := [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // caller is 3,4,5
        revealed := [false, false, false, false, false, false, false, false, false, false];
        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                let newSecret = {
                    secret_id = id;
                    author_id = caller;

                    payload = c.payloads[3];
                    uploader_public_key = c.secret_public_key;
                    reward = 10;

                    expiry_time = now - 250000;
                    last_heartbeat = now - 250000;
                    heartbeat_freq = 86400;

                    share_holder_ids = share_holder_ids;
                    share_holder_stake_ids = share_holder_stake_ids;

                    shares=Array.tabulate(share_holder_stake_ids.size(), func (i: Nat): Text {
                        if (revealed[i]) {
                            return c.decrypted_shares[i];
                        } else {
                            return c.shares[i];
                        };
                    });
                    decrypted_share_shas = c.shas;
                    revealed = revealed;
                }; 
                secrets.put(id, newSecret);
            };
            case _ {};
        };

        // reveal in progress
        id += 1; // 9
        share_holder_stake_ids := [2, 2, 1, 1, 1, 1, 1, 1, 1, 1]; // caller is 3,4,5
        revealed := [true, true, false, false, false, false, false, false, false, false];
        switch (stakerManager.getPrincipals(share_holder_stake_ids)) {
            case (#ok(share_holder_ids)) {
                let newSecret = {
                    secret_id = id;
                    author_id = caller;

                    payload = c.payloads[3];
                    uploader_public_key = c.secret_public_key;
                    reward = 10;

                    expiry_time = now + 250000;
                    last_heartbeat = now - 100000;
                    heartbeat_freq = 86400;

                    share_holder_ids = share_holder_ids;
                    share_holder_stake_ids = share_holder_stake_ids;

                    shares=Array.tabulate(share_holder_stake_ids.size(), func (i: Nat): Text {
                        if (revealed[i]) {
                            return c.decrypted_shares[i];
                        } else {
                            return c.shares[i];
                        };
                    });
                    decrypted_share_shas = c.shas;
                    revealed = revealed;
                }; 
                secrets.put(id, newSecret);
            };
            case _ {};
        };
    
    };
};