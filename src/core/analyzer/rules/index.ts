import type { AnalyzerRule } from "../types";
import { crossJoinRule } from "./crossJoin";
import { deleteWithoutWhereRule } from "./deleteWithoutWhere";
import { distinctOveruseRule } from "./distinctOveruse";
import { functionInWhereRule } from "./functionInWhere";
import { groupByManyColumnsRule } from "./groupByManyColumns";
import { implicitConversionRiskRule } from "./implicitConversionRisk";
import { leadingWildcardLikeRule } from "./leadingWildcardLike";
import { missingJoinConditionRule } from "./missingJoinCondition";
import { notInNullRiskRule } from "./notInNullRisk";
import { nullableNotInRule } from "./nullableNotIn";
import { offsetPaginationRule } from "./offsetPagination";
import { orderByRandomRule } from "./orderByRandom";
import { orderByWithoutLimitRule } from "./orderByWithoutLimit";
import { possibleNPlusOnePatternRule } from "./possibleNPlusOnePattern";
import { selectStarRule } from "./selectStar";
import { tooManyJoinsRule } from "./tooManyJoins";
import { tooManyOrConditionsRule } from "./tooManyOrConditions";
import { unboundedSelectRule } from "./unboundedSelect";
import { unsafeDropTableRule } from "./unsafeDropTable";
import { updateWithoutWhereRule } from "./updateWithoutWhere";

export const analyzerRules: AnalyzerRule[] = [
  selectStarRule,
  updateWithoutWhereRule,
  deleteWithoutWhereRule,
  leadingWildcardLikeRule,
  functionInWhereRule,
  orderByWithoutLimitRule,
  offsetPaginationRule,
  tooManyOrConditionsRule,
  crossJoinRule,
  missingJoinConditionRule,
  distinctOveruseRule,
  groupByManyColumnsRule,
  notInNullRiskRule,
  implicitConversionRiskRule,
  unboundedSelectRule,
  tooManyJoinsRule,
  possibleNPlusOnePatternRule,
  orderByRandomRule,
  nullableNotInRule,
  unsafeDropTableRule,
];
