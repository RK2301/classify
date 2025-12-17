import { ExchangesName, Publisher } from "@rkh-ms/classify-lib";
import { StudentWithdrawalEvent } from "@rkh-ms/classify-lib/interfaces";

export class StudentWithdrawalPublisher extends Publisher<StudentWithdrawalEvent> {
    exchange: ExchangesName.StudentWithdrawal = ExchangesName.StudentWithdrawal
}