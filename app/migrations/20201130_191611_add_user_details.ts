import Migration from "./Migration";
import { Database } from "@/wrappers/sqlite";

export class AddUserDetails_20201130_191611 extends Migration {
    public async up(db: Database): Promise<void> {
        return db.batch(["ALTER TABLE accounts ADD COLUMN details TEXT"]);
    }
}
